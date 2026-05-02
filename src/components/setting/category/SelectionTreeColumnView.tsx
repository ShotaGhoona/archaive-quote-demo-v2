import { useEffect, useMemo, useState } from "react";
import { Pencil, ChevronRight, Calculator, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useSelectionTreeNodes,
  type QuoteCategory,
  type SelectionTreeNode,
} from "@/hooks/useSelectionTreeNodes";
import { useNodeMasters } from "@/hooks/useNodeMasters";
import { useFormulaTemplate } from "@/hooks/useFormulaTemplates";
import { ColumnEditDialog } from "./ColumnEditDialog";
import { LeafFormulaDialog } from "./LeafFormulaDialog";

interface Props {
  category: QuoteCategory;
}

export function SelectionTreeColumnView({ category }: Props) {
  const { data: nodes, isLoading } = useSelectionTreeNodes(category);
  const { data: nodeMasters } = useNodeMasters();

  // 選択経路（root → 末端）
  const [path, setPath] = useState<string[]>([]);
  const [editColumn, setEditColumn] = useState<{
    parentId: string | null;
    children: SelectionTreeNode[];
  } | null>(null);
  const [leafTarget, setLeafTarget] = useState<SelectionTreeNode | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex gap-3 h-full">
        <Skeleton className="h-full w-56" />
        <Skeleton className="h-full w-56" />
      </div>
    );
  }

  // 表示する列の親ID列（null = root, それ以降は path のID）
  const columnParents: (string | null)[] = [null, ...path];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 h-full">
      {columnParents.map((parentId, depth) => {
        const children = childrenByParent.get(parentId) ?? [];
        const masterId =
          children.find((c) => c.node_master_value)?.node_master_value
            ?.node_master_id ?? null;
        const masterName =
          (nodeMasters ?? []).find((m) => m.id === masterId)?.name ?? null;
        const selectedChildId = depth < path.length ? path[depth] : null;

        // この列の親ノード（root=null の場合は null）
        const parentNode =
          parentId == null
            ? null
            : (nodes ?? []).find((n) => n.id === parentId) ?? null;

        return (
          <ColumnPane
            key={parentId ?? "__root__"}
            masterName={masterName}
            children={children}
            selectedChildId={selectedChildId}
            // root は葉化できない（親ノードが無いので）
            canBecomeLeaf={parentNode != null}
            parentFormulaId={parentNode?.formula_template_id ?? null}
            // 各子ノードが子を持つかの判定用
            hasChildren={(nodeId) =>
              (childrenByParent.get(nodeId)?.length ?? 0) > 0
            }
            onEditClick={() => setEditColumn({ parentId, children })}
            onLeafClick={() => parentNode && setLeafTarget(parentNode)}
            onNodeClick={(node) => {
              setPath((prev) => [...prev.slice(0, depth), node.id]);
            }}
          />
        );
      })}

      {editColumn && (
        <ColumnEditDialog
          open={!!editColumn}
          onOpenChange={(o) => !o && setEditColumn(null)}
          category={category}
          parentId={editColumn.parentId}
          currentChildren={editColumn.children}
        />
      )}

      <LeafFormulaDialog
        open={!!leafTarget}
        onOpenChange={(o) => !o && setLeafTarget(null)}
        parentNode={leafTarget}
        category={category}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 1 つの列
// ────────────────────────────────────────────────────────────────────
interface ColumnPaneProps {
  masterName: string | null;
  children: SelectionTreeNode[];
  selectedChildId: string | null;
  canBecomeLeaf: boolean;
  parentFormulaId: string | null;
  hasChildren: (nodeId: string) => boolean;
  onEditClick: () => void;
  onLeafClick: () => void;
  onNodeClick: (n: SelectionTreeNode) => void;
}

function ColumnPane({
  masterName,
  children,
  selectedChildId,
  canBecomeLeaf,
  parentFormulaId,
  hasChildren,
  onEditClick,
  onLeafClick,
  onNodeClick,
}: ColumnPaneProps) {
  const isEmpty = children.length === 0;
  const isLeafWithFormula = isEmpty && !!parentFormulaId;

  return (
    <div className="w-56 shrink-0 border border-border rounded-md flex flex-col bg-card h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-sm font-medium truncate",
            !masterName && !isLeafWithFormula && "text-muted-foreground italic"
          )}
        >
          {isLeafWithFormula ? "計算式" : masterName ?? "未設定"}
        </span>
        {(isLeafWithFormula || !isEmpty) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={isLeafWithFormula ? onLeafClick : onEditClick}
            aria-label="編集"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-1 overflow-y-auto">
        {isLeafWithFormula ? (
          <FormulaInfoPanel formulaId={parentFormulaId!} />
        ) : isEmpty ? (
          <div className="p-3 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8"
              onClick={onEditClick}
            >
              <GitBranch className="h-3.5 w-3.5" />
              ノードで分岐
            </Button>
            {canBecomeLeaf && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs h-8"
                onClick={onLeafClick}
              >
                <Calculator className="h-3.5 w-3.5" />
                計算式で葉にする
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {children.map((node) => {
              // 葉として確定: 計算式が紐づいていて、かつ子を持たない
              const isLeafNode =
                !!node.formula_template_id && !hasChildren(node.id);
              return (
                <button
                  key={node.id}
                  onClick={() => onNodeClick(node)}
                  className={cn(
                    "w-full flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                    selectedChildId === node.id
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span className="flex-1 truncate">{node.label}</span>
                  {isLeafNode && (
                    <Calculator className="h-3 w-3 text-muted-foreground" />
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 葉にリンクされた計算式の表示パネル
// ────────────────────────────────────────────────────────────────────
function FormulaInfoPanel({ formulaId }: { formulaId: string }) {
  const { data: formula, isLoading } = useFormulaTemplate(formulaId);

  if (isLoading) {
    return (
      <div className="p-3">
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (!formula) {
    return (
      <div className="p-3 text-xs text-muted-foreground italic">
        計算式が見つかりません（削除された可能性）
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium truncate">{formula.name}</span>
        </div>
        <code className="block text-[10px] font-mono text-muted-foreground break-all leading-relaxed">
          {formula.formula}
        </code>
      </div>
    </div>
  );
}
