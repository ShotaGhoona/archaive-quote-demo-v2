import { useState } from "react";
import { Pencil, Trash2, Plus, Variable as VariableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  useVariableDefinitions,
  useDeleteVariableDefinition,
  type VariableDefinition,
} from "@/hooks/useVariableDefinitions";
import { VariableDialog } from "./VariableDialog";

type VariableWithUnit = VariableDefinition & {
  unit?: { id: string; code: string; name: string } | null;
};

export function VariablesSection() {
  const { data: variables, isLoading } = useVariableDefinitions();
  const deleteVariable = useDeleteVariableDefinition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VariableDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariableDefinition | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVariable.mutateAsync(deleteTarget.id);
      toast.success("削除しました");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <VariableIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">変数</h2>
              <p className="text-sm text-muted-foreground">計算式で使う変数の定義</p>
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
                  <TableHead>ラベル</TableHead>
                  <TableHead>型</TableHead>
                  <TableHead>単位</TableHead>
                  <TableHead>ソース</TableHead>
                  <TableHead>必須</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!variables?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      変数がありません。「新規追加」から登録してください。
                    </TableCell>
                  </TableRow>
                ) : (
                  (variables as VariableWithUnit[]).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-sm">{v.code}</TableCell>
                      <TableCell>{v.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{v.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {v.unit ? `${v.unit.name} (${v.unit.code})` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{v.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.required ? "必須" : "任意"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditTarget(v);
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
                          onClick={() => setDeleteTarget(v)}
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

        <VariableDialog
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
              <AlertDialogTitle>変数を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteTarget?.label ?? ""}」（{deleteTarget?.code}）を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteVariable.isPending}
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
