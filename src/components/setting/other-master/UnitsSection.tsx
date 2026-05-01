import { useState } from "react";
import { Pencil, Trash2, Plus, Ruler } from "lucide-react";
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
import { useUnits, useDeleteUnit, type Unit } from "@/hooks/useUnits";
import { UnitDialog } from "./UnitDialog";

export function UnitsSection() {
  const { data: units, isLoading } = useUnits();
  const deleteUnit = useDeleteUnit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUnit.mutateAsync(deleteTarget.id);
      toast.success("削除しました");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ruler className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">単位</h2>
              <p className="text-sm text-muted-foreground">単位の管理</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            新規追加
          </Button>
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
                  <TableHead>コード</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>区分</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!units?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      単位がありません。「新規追加」から登録してください。
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono">{unit.code}</TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {unit.dimension ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditTarget(unit);
                            setDialogOpen(true);
                          }}
                          aria-label="編集"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(unit)}
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

        <UnitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          target={editTarget}
        />

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>単位を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteTarget?.name ?? ""}」を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteUnit.isPending}
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}
