import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  QUOTE_CATEGORIES,
  type QuoteCategory,
} from "@/hooks/useSelectionTreeNodes";
import {
  useCreateQuoteDetail,
  useQuoteDetails,
} from "@/hooks/useQuotes";
import { useQuoteFormulaSettings } from "@/hooks/useQuoteFormulaSettings";
import { useGFormulaTemplates } from "@/hooks/useFormulaTemplates";
import { computeCategoryTotal, roundValue } from "@/lib/quoteCalc";
import { EditableDetailCard } from "./EditableDetailCard";

interface Props {
  quoteLotId: string;
}

export function QuotePanel({ quoteLotId }: Props) {
  const { data: details, isLoading } = useQuoteDetails(quoteLotId);
  const { data: settings } = useQuoteFormulaSettings();
  const { data: gTemplates } = useGFormulaTemplates();

  // カテゴリごとの中計
  const categoryTotals = useMemo(() => {
    const enabled = (settings?.enabled_categories ?? []) as QuoteCategory[];
    const gMap =
      (settings?.category_g_templates ?? {}) as Record<string, string | null>;
    const marginMap =
      (settings?.category_margins ?? {}) as Record<string, number>;

    const result: Record<QuoteCategory, number> = {
      MATERIAL: 0,
      IN_HOUSE: 0,
      OUTSOURCE: 0,
      PURCHASE: 0,
      EXPENSE: 0,
    };

    for (const cat of QUOTE_CATEGORIES) {
      if (!enabled.includes(cat.id)) continue;
      const items = (details ?? []).filter((d) => d.category === cat.id);
      const subtotals = items.map((d) => d.computed_value ?? 0);
      const transports = items.map((d) => d.transport_cost ?? 0);

      const gTplId = gMap[cat.id];
      const gTpl = gTemplates?.find((t) => t.id === gTplId);
      const builtinKey = gTpl?.builtin_key ?? "G_pass";
      const margin = marginMap[cat.id] ?? 0;

      result[cat.id] = computeCategoryTotal(
        subtotals,
        builtinKey,
        margin,
        transports
      );
    }
    return result;
  }, [details, settings, gTemplates]);

  const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const roundingMethod = settings?.rounding_method ?? "ROUND";
  const roundingDigits = settings?.rounding_digits ?? 0;
  const roundedTotal = roundValue(grandTotal, roundingMethod, roundingDigits);

  // 有効化されたカテゴリのみ表示
  const enabledCategoryIds = (settings?.enabled_categories ?? []) as QuoteCategory[];
  const visibleCategories = QUOTE_CATEGORIES.filter((c) =>
    enabledCategoryIds.includes(c.id)
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (visibleCategories.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        有効なカテゴリがありません。設定画面でカテゴリを有効化してください。
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs
        defaultValue={visibleCategories[0].id}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="px-4 pt-4 shrink-0">
          <TabsList className="w-full">
            {visibleCategories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex-1">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {visibleCategories.map((cat) => (
          <TabsContent
            key={cat.id}
            value={cat.id}
            className="flex-1 min-h-0 overflow-hidden mt-3"
          >
            <CategoryContent category={cat.id} quoteLotId={quoteLotId} />
          </TabsContent>
        ))}
      </Tabs>

      <Separator />

      <div className="p-4 space-y-2 shrink-0 bg-muted/20">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {visibleCategories.map((cat) => (
            <div key={cat.id} className="flex justify-between">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-mono">
                ¥ {Math.round(categoryTotals[cat.id]).toLocaleString("ja-JP")}
              </span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex justify-between items-baseline">
          <span className="text-base font-medium">合計</span>
          <span className="font-mono text-2xl font-bold">
            ¥ {Math.round(roundedTotal).toLocaleString("ja-JP")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// カテゴリごとの本体
// ────────────────────────────────────────────────────────────────────
function CategoryContent({
  category,
  quoteLotId,
}: {
  category: QuoteCategory;
  quoteLotId: string;
}) {
  const { data: details } = useQuoteDetails(quoteLotId);
  const createDetail = useCreateQuoteDetail();
  const filtered = (details ?? []).filter((d) => d.category === category);

  const handleAdd = async () => {
    try {
      await createDetail.mutateAsync({
        quote_lot_id: quoteLotId,
        category,
      });
    } catch (e: any) {
      toast.error(e.message || "追加に失敗しました");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-6">
            まだ明細がありません
          </div>
        )}
        {filtered.map((d, i) => (
          <EditableDetailCard
            key={d.id}
            index={i + 1}
            category={category}
            detail={d}
          />
        ))}
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={createDetail.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
