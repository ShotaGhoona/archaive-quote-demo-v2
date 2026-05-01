import { useEffect, useState } from "react";
import { Sigma } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useQuoteFormulaSettings,
  useUpdateCategoryGTemplate,
  useUpdateCategoryMargin,
} from "@/hooks/useQuoteFormulaSettings";
import { useGFormulaTemplates } from "@/hooks/useFormulaTemplates";
import { type QuoteCategory } from "@/hooks/useSelectionTreeNodes";

interface Props {
  category: QuoteCategory;
}

const NONE_VALUE = "__none__";

export function GFormulaSection({ category }: Props) {
  const { data: settings, isLoading: loadingSettings } = useQuoteFormulaSettings();
  const { data: gTemplates, isLoading: loadingTemplates } = useGFormulaTemplates();
  const updateGTemplate = useUpdateCategoryGTemplate();
  const updateMargin = useUpdateCategoryMargin();

  const categoryGMap =
    (settings?.category_g_templates ?? {}) as Record<string, string | null>;
  const marginMap = (settings?.category_margins ?? {}) as Record<string, number>;

  const currentGId = categoryGMap[category] ?? null;
  const currentMargin = marginMap[category] ?? 0;

  const [selectedGId, setSelectedGId] = useState<string | null>(currentGId);
  const [marginInput, setMarginInput] = useState<string>(String(currentMargin * 100));

  useEffect(() => {
    setSelectedGId(currentGId);
    setMarginInput(String(currentMargin * 100));
  }, [currentGId, currentMargin]);

  const selected = gTemplates?.find((t) => t.id === selectedGId) ?? null;
  const isMarginTemplate = selected?.builtin_key === "G_margin";

  const isLoading = loadingSettings || loadingTemplates;
  const isPending = updateGTemplate.isPending || updateMargin.isPending;

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateGTemplate.mutateAsync({
        id: settings.id,
        category,
        currentMap: categoryGMap,
        gTemplateId: selectedGId,
      });
      if (isMarginTemplate) {
        const m = Number(marginInput);
        if (Number.isNaN(m)) {
          toast.error("利益率は数値で入力してください");
          return;
        }
        await updateMargin.mutateAsync({
          id: settings.id,
          category,
          currentMargins: marginMap,
          margin: m / 100,
        });
      }
      toast.success("保存しました");
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sigma className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">G の式（中計）</h3>
          <p className="text-sm text-muted-foreground">
            このカテゴリの中計をどう求めるかを設定
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>テンプレート</Label>
        <Select
          value={selectedGId ?? NONE_VALUE}
          onValueChange={(v) => setSelectedGId(v === NONE_VALUE ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>（未設定）</SelectItem>
            {(gTemplates ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} {t.description ? `— ${t.description}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="rounded-md border border-border p-4 space-y-2 bg-muted/30">
          <div className="text-xs text-muted-foreground">式プレビュー</div>
          <code className="block text-sm font-mono">{selected.formula}</code>
          {selected.description && (
            <p className="text-xs text-muted-foreground pt-1">{selected.description}</p>
          )}
        </div>
      )}

      {isMarginTemplate && (
        <div className="space-y-2">
          <Label htmlFor="margin">
            利益率 (%)
          </Label>
          <Input
            id="margin"
            type="number"
            step="0.1"
            value={marginInput}
            onChange={(e) => setMarginInput(e.target.value)}
            placeholder="例: 10"
            className="max-w-32"
          />
          <p className="text-xs text-muted-foreground">
            式中の <code className="font-mono">category_margin</code> に <strong>{(Number(marginInput) || 0) / 100}</strong> が代入されます
          </p>
        </div>
      )}

      <div className="pt-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
