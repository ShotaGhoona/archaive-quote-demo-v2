import { useState } from "react";
import { Pencil, Trash2, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  useFormulaTemplates,
  useDeleteFormulaTemplate,
  type FormulaTemplate,
} from "@/hooks/useFormulaTemplates";
import { type QuoteCategory } from "@/hooks/useSelectionTreeNodes";
import { FormulaTemplateDialog } from "./FormulaTemplateDialog";

interface Props {
  category: QuoteCategory;
}

export function FormulaTemplatesList({ category }: Props) {
  const { data: templates, isLoading } = useFormulaTemplates(category);
  const deleteTemplate = useDeleteFormulaTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FormulaTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormulaTemplate | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      toast.success("削除しました");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          新規計算式
        </Button>
      </div>

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
                <TableHead>計算式</TableHead>
                <TableHead>変数</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="w-[100px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!templates?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    計算式がありません。「新規計算式」から作成してください。
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => {
                  const vars = Array.isArray(t.variables) ? (t.variables as unknown[]) : [];
                  const codes = vars
                    .map((v) =>
                      typeof v === "object" && v && "code" in v
                        ? (v as { code: unknown }).code
                        : null
                    )
                    .filter((c): c is string => typeof c === "string");
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {t.is_builtin && <Lock className="h-3 w-3 text-muted-foreground" />}
                          {t.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <code className="break-all">{t.formula}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {codes.length === 0 ? (
                            <span className="text-xs text-muted-foreground">-</span>
                          ) : (
                            codes.map((c) => (
                              <Badge key={c} variant="secondary" className="font-mono text-xs">
                                {c}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t.description ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={t.is_builtin ?? false}
                          onClick={() => {
                            setEditTarget(t);
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
                          disabled={t.is_builtin ?? false}
                          onClick={() => setDeleteTarget(t)}
                          aria-label="削除"
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

      <FormulaTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={category}
        target={editTarget}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>計算式を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name ?? ""}」を削除します。この計算式が紐づいている葉ノードはリンクが解除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
