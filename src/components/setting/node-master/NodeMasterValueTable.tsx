import { useState } from "react";
import { Pencil, Trash2, Lock, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { TITLE_ATTRIBUTE } from "@/types/nodeMaster";
import type { NodeMaster } from "@/hooks/useNodeMasters";
import {
  useNodeMasterValues,
  useDeleteNodeMasterValue,
  type NodeMasterValue,
} from "@/hooks/useNodeMasterValues";

interface Props {
  nodeMaster: NodeMaster;
  onAddClick: () => void;
  onEditClick: (value: NodeMasterValue) => void;
  onSettingsClick: () => void;
}

export function NodeMasterValueTable({
  nodeMaster,
  onAddClick,
  onEditClick,
  onSettingsClick,
}: Props) {
  const { data: values, isLoading } = useNodeMasterValues(nodeMaster.id);
  const deleteValue = useDeleteNodeMasterValue();
  const [deleteTarget, setDeleteTarget] = useState<NodeMasterValue | null>(null);

  // attribute_schema の先頭に title を必ず置く
  const schema = [TITLE_ATTRIBUTE, ...nodeMaster.attribute_schema.filter((a) => a.key !== "title")];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteValue.mutateAsync({
        id: deleteTarget.id,
        node_master_id: nodeMaster.id,
      });
      toast.success("削除しました");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{nodeMaster.name} 管理</h3>
        <div className="flex items-center gap-2">
          <Button onClick={onAddClick} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新規追加
          </Button>
          <Button onClick={onSettingsClick} size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            設定
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {schema.map((attr) => (
                  <TableHead key={attr.key}>
                    <span className="inline-flex items-center gap-1">
                      {attr.label}
                      {attr.key === "title" && <Lock className="h-3 w-3" />}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="w-[100px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!values?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={schema.length + 1}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    値がありません。「新規追加」から登録してください。
                  </TableCell>
                </TableRow>
              ) : (
                values.map((value) => (
                  <TableRow key={value.id}>
                    {schema.map((attr) => (
                      <TableCell key={attr.key}>
                        {formatCell(value.values[attr.key])}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditClick(value)}
                        aria-label="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(value)}
                        aria-label="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>値を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.values.title ?? ""}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteValue.isPending}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "はい" : "いいえ";
  return String(v);
}
