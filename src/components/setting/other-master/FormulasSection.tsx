import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Lock, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { QUOTE_CATEGORIES } from "@/hooks/useSelectionTreeNodes";
import { FormulaDialog } from "./FormulaDialog";

const FILTER_ALL = "__all__";
const FILTER_NONE = "__none__";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  QUOTE_CATEGORIES.map((c) => [c.id, c.label])
);

export function FormulasSection() {
  const { data: templates, isLoading } = useFormulaTemplates();
  const deleteTemplate = useDeleteFormulaTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FormulaTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormulaTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>(FILTER_ALL);

  const filtered = useMemo(() => {
    if (!templates) return [];
    if (filterCategory === FILTER_ALL) return templates;
    if (filterCategory === FILTER_NONE)
      return templates.filter((t) => !t.category);
    return templates.filter((t) => t.category === filterCategory);
  }, [templates, filterCategory]);

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
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">計算式</h2>
              <p className="text-sm text-muted-foreground">
                小計を求めるための式を登録（カテゴリを跨いで利用可能）
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
           <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>すべて</SelectItem>
                <SelectItem value={FILTER_NONE}>共通（未設定）</SelectItem>
                {QUOTE_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>計算式</TableHead>
                  <TableHead>変数</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filtered.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      {templates?.length
                        ? "該当する計算式がありません"
                        : "計算式がありません。「新規追加」から作成してください。"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => {
                    const vars = Array.isArray(t.variables)
                      ? (t.variables as unknown[])
                      : [];
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
                            {t.is_builtin && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                            {t.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.category ? (
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORY_LABELS[t.category] ?? t.category}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              共通
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <code className="break-all">{t.formula}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {codes.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            ) : (
                              codes.map((c) => (
                                <Badge
                                  key={c}
                                  variant="secondary"
                                  className="font-mono text-xs"
                                >
                                  {c}
                                </Badge>
                              ))
                            )}
                          </div>
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

        <FormulaDialog
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
              <AlertDialogTitle>計算式を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteTarget?.name ?? ""}
                」を削除します。この計算式が紐づいている葉ノードはリンクが解除されます。
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
    </ScrollArea>
  );
}
