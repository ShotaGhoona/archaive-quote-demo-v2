import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useVariableDefinitions } from "@/hooks/useVariableDefinitions";
import {
  useCreateFormulaTemplate,
  useUpdateFormulaTemplate,
  type FormulaTemplate,
} from "@/hooks/useFormulaTemplates";
import { type QuoteCategory } from "@/hooks/useSelectionTreeNodes";
import { VariableDialog } from "@/components/setting/other-master/VariableDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: QuoteCategory;
  target: FormulaTemplate | null;
  onSaved?: (id: string) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  PATH: "パス（経路から取得）",
  MASTER: "マスタ参照",
  LOOKUP: "LOOKUP参照",
  MANUAL: "手入力",
};

export function FormulaTemplateDialog({
  open,
  onOpenChange,
  category,
  target,
  onSaved,
}: Props) {
  const isEdit = !!target;
  const { data: variables, isLoading: loadingVars } = useVariableDefinitions();
  const createTemplate = useCreateFormulaTemplate();
  const updateTemplate = useUpdateFormulaTemplate();
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVarCodes, setSelectedVarCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setName(target?.name ?? "");
    setFormula(target?.formula ?? "");
    setDescription(target?.description ?? "");
    // target.variables is JSONB array of { code: ... }
    const arr = Array.isArray(target?.variables) ? (target!.variables as unknown[]) : [];
    const codes = arr
      .map((v) => (typeof v === "object" && v && "code" in v ? (v as { code: unknown }).code : null))
      .filter((c): c is string => typeof c === "string");
    setSelectedVarCodes(new Set(codes));
  }, [open, target]);

  // ソースごとにグループ化
  const grouped = useMemo(() => {
    const map = new Map<string, typeof variables>();
    for (const src of ["PATH", "MASTER", "LOOKUP", "MANUAL"]) {
      map.set(src, []);
    }
    for (const v of variables ?? []) {
      const src = v.source ?? "MANUAL";
      const arr = map.get(src) ?? [];
      arr.push(v);
      map.set(src, arr);
    }
    return map;
  }, [variables]);

  const toggleVar = (code: string) => {
    setSelectedVarCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !formula.trim()) {
      toast.error("名前と計算式は必須です");
      return;
    }
    const variablesJson = Array.from(selectedVarCodes).map((code) => ({ code }));

    try {
      if (isEdit && target) {
        await updateTemplate.mutateAsync({
          id: target.id,
          name: name.trim(),
          formula: formula.trim(),
          description: description.trim() || null,
          variables: variablesJson,
        });
        toast.success("更新しました");
        onSaved?.(target.id);
      } else {
        const result = await createTemplate.mutateAsync({
          name: name.trim(),
          formula: formula.trim(),
          description: description.trim() || null,
          category,
          variables: variablesJson,
        });
        toast.success("計算式を作成しました");
        onSaved?.(result.id);
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;
  const selectedList = (variables ?? []).filter((v) => selectedVarCodes.has(v.code));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "計算式の編集" : "新規計算式"}
            </DialogTitle>
            <DialogDescription>
              使う変数を選び、それらを使った計算式を組み立てます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                名前<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: SS400 重量計算"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: SS400 の丸棒材料費"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>使う変数</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVariableDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  新しい変数
                </Button>
              </div>

              {loadingVars ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="border border-border rounded-md max-h-72 overflow-y-auto divide-y">
                  {Array.from(grouped.entries()).map(([src, vars]) => (
                    <div key={src} className="p-2">
                      <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                        {SOURCE_LABELS[src] ?? src}
                      </div>
                      {!vars || vars.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-muted-foreground italic">
                          （なし）
                        </div>
                      ) : (
                        vars.map((v) => (
                          <label
                            key={v.id}
                            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded-sm"
                          >
                            <Checkbox
                              checked={selectedVarCodes.has(v.code)}
                              onCheckedChange={() => toggleVar(v.code)}
                            />
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {v.code}
                            </code>
                            <span className="text-sm">{v.label}</span>
                            {v.description && (
                              <span className="text-xs text-muted-foreground truncate ml-auto">
                                {v.description}
                              </span>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedList.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  選択中（計算式で使えます）
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedList.map((v) => (
                    <Badge key={v.id} variant="secondary" className="font-mono">
                      {v.code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="formula">
                計算式<span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="formula"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="例: (d/2)^2 * PI * L * rho/1000000 * P * Y"
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                変数コードを式の中で参照してください（例: <code className="font-mono">d * L * rho</code>）
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VariableDialog
        open={variableDialogOpen}
        onOpenChange={setVariableDialogOpen}
        target={null}
      />
    </>
  );
}
