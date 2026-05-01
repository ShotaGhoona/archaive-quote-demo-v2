import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNodeMasters } from "@/hooks/useNodeMasters";
import { useNodeMasterValues } from "@/hooks/useNodeMasterValues";
import {
  useUpdateColumnValues,
  useDeleteAllChildren,
  type QuoteCategory,
  type SelectionTreeNode,
} from "@/hooks/useSelectionTreeNodes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: QuoteCategory;
  parentId: string | null;
  /** この列の現在の子ノード一覧 */
  currentChildren: SelectionTreeNode[];
}

export function ColumnEditDialog({
  open,
  onOpenChange,
  category,
  parentId,
  currentChildren,
}: Props) {
  const { data: nodeMasters, isLoading: loadingMasters } = useNodeMasters();
  const updateColumn = useUpdateColumnValues();
  const deleteAllChildren = useDeleteAllChildren();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // 現在のノードマスタ（子の最初の値から推定）
  const currentMasterId =
    currentChildren.find((c) => c.node_master_value)?.node_master_value
      ?.node_master_id ?? null;

  const [masterId, setMasterId] = useState<string | null>(currentMasterId);
  const [selectedValueIds, setSelectedValueIds] = useState<Set<string>>(new Set());

  const { data: values, isLoading: loadingValues } = useNodeMasterValues(masterId);

  // ダイアログを開いたとき: 状態を初期化
  useEffect(() => {
    if (!open) return;
    setMasterId(currentMasterId);
    if (currentMasterId) {
      const ids = currentChildren
        .filter((c) => c.node_master_value?.node_master_id === currentMasterId)
        .map((c) => c.node_master_value_id)
        .filter((id): id is string => !!id);
      setSelectedValueIds(new Set(ids));
    } else {
      setSelectedValueIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ノードマスタを変更したら値の選択をリセット
  const isMasterChanged = currentMasterId !== null && masterId !== currentMasterId;
  useEffect(() => {
    if (isMasterChanged) {
      setSelectedValueIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterId]);

  const removedCount = useMemo(() => {
    if (!isMasterChanged) {
      const currentValueIds = new Set(
        currentChildren.map((c) => c.node_master_value_id).filter(Boolean) as string[]
      );
      let n = 0;
      currentValueIds.forEach((vid) => {
        if (!selectedValueIds.has(vid)) n += 1;
      });
      return n;
    }
    // master が変わった場合は既存全部削除
    return currentChildren.length;
  }, [isMasterChanged, currentChildren, selectedValueIds]);

  const handleToggle = (valueId: string) => {
    setSelectedValueIds((prev) => {
      const next = new Set(prev);
      if (next.has(valueId)) next.delete(valueId);
      else next.add(valueId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!masterId) {
      toast.error("ノードマスタを選択してください");
      return;
    }
    try {
      await updateColumn.mutateAsync({
        category,
        parentId,
        nodeMasterId: masterId,
        targetValueIds: Array.from(selectedValueIds),
        currentChildren,
      });
      toast.success("列を更新しました");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "更新に失敗しました");
    }
  };

  const handleClear = async () => {
    if (!parentId) {
      toast.error("ルート列の消去は未対応です");
      return;
    }
    try {
      await deleteAllChildren.mutateAsync({ parentId, category });
      toast.success("子ノードを消去しました");
      setConfirmClearOpen(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "消去に失敗しました");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>列の設定</DialogTitle>
          <DialogDescription>
            この列で扱うノードマスタと、その中から採用する値を選びます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ノードマスタ</Label>
            {loadingMasters ? (
              <Skeleton className="h-9" />
            ) : (
              <Select
                value={masterId ?? ""}
                onValueChange={(v) => setMasterId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ノードマスタを選択" />
                </SelectTrigger>
                <SelectContent>
                  {(nodeMasters ?? []).map((nm) => (
                    <SelectItem key={nm.id} value={nm.id}>
                      {nm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isMasterChanged && currentChildren.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ノードマスタを変更すると、既存の {currentChildren.length} 件の子ノードと配下のすべての階層が削除されます。
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>採用する値</Label>
            {!masterId ? (
              <p className="text-sm text-muted-foreground">
                先にノードマスタを選択してください
              </p>
            ) : loadingValues ? (
              <div className="space-y-2">
                <Skeleton className="h-7" />
                <Skeleton className="h-7" />
              </div>
            ) : !values?.length ? (
              <p className="text-sm text-muted-foreground">
                このノードマスタに値がありません。先に「ノードマスタ」画面で値を登録してください。
              </p>
            ) : (
              <div className="border border-border rounded-md max-h-64 overflow-y-auto divide-y">
                {values.map((v) => {
                  const title = (v.values as Record<string, unknown>).title;
                  const label = typeof title === "string" && title ? title : "(無題)";
                  return (
                    <label
                      key={v.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedValueIds.has(v.id)}
                        onCheckedChange={() => handleToggle(v.id)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {!isMasterChanged && removedCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                チェックを外した {removedCount} 件のノードと配下のすべての階層が削除されます。
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          {currentChildren.length > 0 && parentId && (
            <Button
              variant="destructive"
              onClick={() => setConfirmClearOpen(true)}
              disabled={updateColumn.isPending || deleteAllChildren.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              消去
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateColumn.isPending || !masterId}
            >
              {updateColumn.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>列を消去しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この列の {currentChildren.length} 件の子ノードと配下のすべての階層が削除されます。消去後、空の列に「ノードで分岐」「計算式で葉にする」が表示されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              disabled={deleteAllChildren.isPending}
            >
              消去
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
