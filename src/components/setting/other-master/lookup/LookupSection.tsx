import { useState } from "react";
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react";
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
  useLookupTables,
  useDeleteLookupTable,
  type LookupTable,
  type AxisDefinition,
} from "@/hooks/useLookupTables";
import { LookupEditDialog } from "./LookupEditDialog";
import { LookupDetailDialog } from "./LookupDetailDialog";

export function LookupSection() {
  const { data: tables, isLoading } = useLookupTables();
  const deleteTable = useDeleteLookupTable();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LookupTable | null>(null);
  const [detailTarget, setDetailTarget] = useState<LookupTable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LookupTable | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTable.mutateAsync(deleteTarget.id);
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
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">ルックアップ</h2>
              <p className="text-sm text-muted-foreground">
                軸条件で値を引き合わせるテーブルの管理
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditTarget(null);
              setEditDialogOpen(true);
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
                  <TableHead>名前</TableHead>
                  <TableHead>軸</TableHead>
                  <TableHead>行数</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead className="w-[140px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!tables?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      ルックアップがありません。「新規追加」から作成してください。
                    </TableCell>
                  </TableRow>
                ) : (
                  tables.map((t) => {
                    const axes = Array.isArray(t.axes)
                      ? (t.axes as unknown as AxisDefinition[])
                      : [];
                    const versions = (t as { lookup_table_versions?: unknown[] })
                      .lookup_table_versions ?? [];
                    type V = { id: string; status: string; lookup_rows?: { count: number }[] };
                    const activeV = (versions as V[]).find((v) => v.status === "ACTIVE");
                    const rowCount = activeV?.lookup_rows?.[0]?.count ?? 0;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {axes.length === 0 ? (
                              <span className="text-xs text-muted-foreground">-</span>
                            ) : (
                              axes
                                .slice()
                                .sort(
                                  (a, b) => (a.axis_order ?? 0) - (b.axis_order ?? 0)
                                )
                                .map((a) => (
                                  <Badge
                                    key={a.variable_code}
                                    variant="secondary"
                                    className="font-mono text-xs"
                                  >
                                    {a.variable_code}
                                    <span className="text-muted-foreground ml-1">
                                      {a.match_type}
                                    </span>
                                  </Badge>
                                ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{rowCount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {t.description ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setDetailTarget(t)}
                            aria-label="詳細"
                            title="詳細"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditTarget(t);
                              setEditDialogOpen(true);
                            }}
                            aria-label="編集"
                            title="編集"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(t)}
                            aria-label="削除"
                            title="削除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <LookupEditDialog
          open={editDialogOpen}
          onOpenChange={(o) => {
            setEditDialogOpen(o);
            if (!o) setEditTarget(null);
          }}
          target={editTarget}
        />

        {detailTarget && (
          <LookupDetailDialog
            open={!!detailTarget}
            onOpenChange={(o) => !o && setDetailTarget(null)}
            lookupTable={detailTarget}
          />
        )}

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ルックアップを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteTarget?.name ?? ""}」とそのバージョン・行データを全て削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteTable.isPending}
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
