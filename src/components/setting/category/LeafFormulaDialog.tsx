import { useEffect, useState } from "react";
import { Calculator, Plus, Link2Off } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  type SelectionTreeNode,
  type QuoteCategory,
  useUpdateNodeFormula,
} from "@/hooks/useSelectionTreeNodes";
import { useFormulaTemplates } from "@/hooks/useFormulaTemplates";
import { useVariableDefinitions } from "@/hooks/useVariableDefinitions";
import { FormulaDialog } from "@/components/setting/other-master/FormulaDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentNode: SelectionTreeNode | null;
  category: QuoteCategory;
}

const NONE_VALUE = "__none__";

export function LeafFormulaDialog({
  open,
  onOpenChange,
  parentNode,
  category,
}: Props) {
  // カテゴリ縛りなく全 F テンプレートから選べる（カテゴリ跨ぎ利用可）
  const { data: templates, isLoading } = useFormulaTemplates();
  const { data: variableDefs } = useVariableDefinitions();
  const updateNodeFormula = useUpdateNodeFormula();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    parentNode?.formula_template_id ?? null
  );

  useEffect(() => {
    if (!open) return;
    setSelectedId(parentNode?.formula_template_id ?? null);
  }, [open, parentNode]);

  const selected = templates?.find((t) => t.id === selectedId) ?? null;
  const isLinked = !!parentNode?.formula_template_id;

  const handleSave = async () => {
    if (!parentNode) return;
    try {
      await updateNodeFormula.mutateAsync({
        nodeId: parentNode.id,
        formulaTemplateId: selectedId,
        category,
      });
      toast.success(selectedId ? "計算式をリンクしました" : "リンクを解除しました");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "更新に失敗しました");
    }
  };

  const handleUnlink = async () => {
    if (!parentNode) return;
    try {
      await updateNodeFormula.mutateAsync({
        nodeId: parentNode.id,
        formulaTemplateId: null,
        category,
      });
      toast.success("リンクを解除しました");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "解除に失敗しました");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {parentNode ? `${parentNode.label} の計算式` : "計算式"}
            </DialogTitle>
            <DialogDescription>
              既存の計算式を選ぶか、新規作成して紐づけます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>計算式テンプレート</Label>
              {isLoading ? (
                <Skeleton className="h-9" />
              ) : (
                <Select
                  value={selectedId ?? NONE_VALUE}
                  onValueChange={(v) => setSelectedId(v === NONE_VALUE ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>（未設定）</SelectItem>
                    {(templates ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                新規計算式を作る
              </Button>
            </div>

            {selected && (
              <div className="rounded-md border border-border p-3 space-y-2 bg-muted/30">
                <div className="text-sm font-medium">{selected.name}</div>
                <code className="block text-xs font-mono break-all">
                  {selected.formula}
                </code>
                {selected.description && (
                  <p className="text-xs text-muted-foreground">{selected.description}</p>
                )}
                {Array.isArray(selected.variables) && selected.variables.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {(selected.variables as unknown[]).map((v, i) => {
                        const code =
                          typeof v === "object" && v && "code" in v
                            ? (v as { code: unknown }).code
                            : null;
                        if (typeof code !== "string") return null;
                        const label = variableDefs?.find((d) => d.code === code)?.label;
                        return (
                          <Badge key={i} variant="secondary" className="text-xs gap-1.5">
                            <span className="font-mono">{code}</span>
                            {label && (
                              <span className="text-muted-foreground font-normal">
                                {label}
                              </span>
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between gap-2">
            {isLinked ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnlink}
                disabled={updateNodeFormula.isPending}
              >
                <Link2Off className="h-3.5 w-3.5 mr-1" />
                解除
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateNodeFormula.isPending || selectedId === (parentNode?.formula_template_id ?? null)}
              >
                {updateNodeFormula.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormulaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCategory={category}
        target={null}
        onSaved={(id) => setSelectedId(id)}
      />
    </>
  );
}
