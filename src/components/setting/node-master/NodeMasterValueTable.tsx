import { useState } from "react";
import { Pencil, Trash2, Lock, Plus, Settings, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {nodeMaster.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {nodeMaster.name}の値を管理します
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onAddClick} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              新規追加
            </Button>
            <Button onClick={onSettingsClick} size="sm" variant="outline" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              設定
            </Button>
          </div>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <div className="border border-border rounded-md">
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
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onEditClick(value)}
                          aria-label="編集"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(value)}
                          aria-label="削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
    </ScrollArea>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "はい" : "いいえ";
  return String(v);
}
