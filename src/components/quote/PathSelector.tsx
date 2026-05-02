import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSelectionTreeNodes,
  type QuoteCategory,
  type SelectionTreeNode,
} from "@/hooks/useSelectionTreeNodes";
import { useNodeMasters } from "@/hooks/useNodeMasters";

interface Props {
  category: QuoteCategory;
  /** 葉到達時にコールバック。葉ではないとき null */
  onSelectionChange: (
    leaf: SelectionTreeNode | null,
    path: SelectionTreeNode[]
  ) => void;
  /** 初期パス（保存済みノードIDの配列） */
  initialPath?: string[];
  /** 外部から path をリセットするキー */
  resetKey?: number;
}

/**
 * 横並びプルダウンで階層を選択する。
 * 値を選ぶごとに右側に次の階層プルダウンが出現。葉に到達したら親に通知。
 */
export function PathSelector({
  category,
  onSelectionChange,
  initialPath,
  resetKey,
}: Props) {
  const { data: nodes, isLoading } = useSelectionTreeNodes(category);
  const { data: nodeMasters } = useNodeMasters();
  const [path, setPath] = useState<string[]>(initialPath ?? []);

  // resetKey が変わったら path をクリア
  useEffect(() => {
    if (resetKey !== undefined) setPath([]);
  }, [resetKey]);

  // initialPath が（後から）変わったら反映（保存後のサーバ側更新で残ったままにする）
  useEffect(() => {
    if (initialPath && initialPath.length > 0 && path.length === 0) {
      setPath(initialPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPath?.join(",")]);

  // parent_id でグルーピング
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, SelectionTreeNode[]>();
    for (const n of nodes ?? []) {
      const arr = map.get(n.parent_id) ?? [];
      arr.push(n);
      map.set(n.parent_id, arr);
    }
    return map;
  }, [nodes]);

  // path のうち、もう存在しないノードがあれば切り詰める
  useEffect(() => {
    const validUntil = path.findIndex(
      (id) => !(nodes ?? []).some((n) => n.id === id)
    );
    if (validUntil !== -1) {
      setPath((prev) => prev.slice(0, validUntil));
    }
  }, [nodes, path]);

  // 葉判定: path 末端のノードに子が無く formula が紐づいていれば葉
  useEffect(() => {
    if (path.length === 0) {
      onSelectionChange(null, []);
      return;
    }
    const leafId = path[path.length - 1];
    const leaf = (nodes ?? []).find((n) => n.id === leafId);
    if (!leaf) {
      onSelectionChange(null, []);
      return;
    }
    const fullPath = path
      .map((id) => (nodes ?? []).find((n) => n.id === id))
      .filter((n): n is SelectionTreeNode => !!n);
    const hasChildren = (childrenByParent.get(leafId)?.length ?? 0) > 0;
    if (!hasChildren && leaf.formula_template_id) {
      onSelectionChange(leaf, fullPath);
    } else {
      onSelectionChange(null, fullPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nodes]);

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  // 表示するレベル: path[0..N] の親を辿って、各 parent_id に対する pulldown を表示
  // 末端 +1 まで（葉でなければ次のレベルを描画して選ばせる）
  const levels: { parentId: string | null; selectedId: string | null }[] = [];
  levels.push({ parentId: null, selectedId: path[0] ?? null });
  for (let i = 0; i < path.length; i++) {
    const childrenOfThis = childrenByParent.get(path[i]) ?? [];
    if (childrenOfThis.length > 0) {
      levels.push({ parentId: path[i], selectedId: path[i + 1] ?? null });
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {levels.map((lv, depth) => {
        const children = childrenByParent.get(lv.parentId) ?? [];
        if (children.length === 0) return null;
        const masterId =
          children.find((c) => c.node_master_value)?.node_master_value
            ?.node_master_id ?? null;
        const masterName =
          (nodeMasters ?? []).find((m) => m.id === masterId)?.name ?? null;

        return (
          <Select
            key={`${depth}-${lv.parentId ?? "root"}`}
            value={lv.selectedId ?? ""}
            onValueChange={(val) => {
              setPath((prev) => [...prev.slice(0, depth), val]);
            }}
          >
            <SelectTrigger className="h-9 min-w-[140px] w-auto">
              <SelectValue
                placeholder={masterName ?? `階層 ${depth + 1}`}
              />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}
