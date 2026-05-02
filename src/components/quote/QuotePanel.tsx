import { useMemo, useState } from "react";
import { Plus, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  QUOTE_CATEGORIES,
  useSelectionTreeNodes,
  type QuoteCategory,
} from "@/hooks/useSelectionTreeNodes";
import {
  useCreateQuoteDetail,
  useQuoteDetails,
  type QuoteDetail,
} from "@/hooks/useQuotes";
import { useQuoteFormulaSettings } from "@/hooks/useQuoteFormulaSettings";
import {
  useGFormulaTemplates,
  type FormulaTemplate,
} from "@/hooks/useFormulaTemplates";
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
      // 上書き適用後の final_value を集計（無ければ computed_value にフォールバック）
      const subtotals = items.map((d) => d.final_value ?? d.computed_value ?? 0);
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
  const enabledCategoryIds =
    (settings?.enabled_categories ?? []) as QuoteCategory[];
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

      <TotalsFooter
        visibleCategories={visibleCategories}
        categoryTotals={categoryTotals}
        grandTotal={grandTotal}
        roundedTotal={roundedTotal}
        roundingMethod={roundingMethod}
        roundingDigits={roundingDigits}
        details={details ?? []}
        gTemplates={gTemplates ?? []}
        gMap={(settings?.category_g_templates ?? {}) as Record<string, string | null>}
        marginMap={(settings?.category_margins ?? {}) as Record<string, number>}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 合計フッター（コンパクト + 詳細 popover）
// ────────────────────────────────────────────────────────────────────
interface TotalsFooterProps {
  visibleCategories: { id: QuoteCategory; label: string }[];
  categoryTotals: Record<QuoteCategory, number>;
  grandTotal: number;
  roundedTotal: number;
  roundingMethod: string;
  roundingDigits: number;
  details: QuoteDetail[];
  gTemplates: FormulaTemplate[];
  gMap: Record<string, string | null>;
  marginMap: Record<string, number>;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}

function TotalsFooter({
  visibleCategories,
  categoryTotals,
  grandTotal,
  roundedTotal,
  roundingMethod,
  roundingDigits,
  details,
  gTemplates,
  gMap,
  marginMap,
}: TotalsFooterProps) {
  const equation = visibleCategories
    .map((c) => fmt(categoryTotals[c.id]))
    .join(" + ");

  return (
    <div className="px-4 py-3 shrink-0 bg-muted/20 flex items-center gap-3 text-sm">
      <span className="font-medium shrink-0">合計</span>
      <span className="flex-1 min-w-0 text-right font-mono text-xs text-muted-foreground truncate">
        {equation || "—"} = {fmt(grandTotal)}
      </span>
      <span className="font-mono font-bold text-xl tabular-nums shrink-0">
        ¥ {fmt(roundedTotal)}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7 text-muted-foreground"
            aria-label="詳細"
          >
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[420px]">
          <TotalsBreakdown
            visibleCategories={visibleCategories}
            categoryTotals={categoryTotals}
            grandTotal={grandTotal}
            roundedTotal={roundedTotal}
            roundingMethod={roundingMethod}
            roundingDigits={roundingDigits}
            details={details}
            gTemplates={gTemplates}
            gMap={gMap}
            marginMap={marginMap}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 詳細内訳（popover の中身）
// ────────────────────────────────────────────────────────────────────
function TotalsBreakdown(props: TotalsFooterProps) {
  const {
    visibleCategories,
    categoryTotals,
    grandTotal,
    roundedTotal,
    roundingMethod,
    roundingDigits,
    details,
    gTemplates,
    gMap,
    marginMap,
  } = props;

  const [showFormula, setShowFormula] = useState(true);
  const [showItems, setShowItems] = useState(false);

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      {/* 上部: タイトル + トグル */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">合計の内訳</div>
      </div>

      <div className="flex items-center gap-4 text-xs pb-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Switch
            id="toggle-formula"
            checked={showFormula}
            onCheckedChange={setShowFormula}
            className="scale-75"
          />
          <Label
            htmlFor="toggle-formula"
            className="text-xs cursor-pointer"
          >
            G式の詳細
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            id="toggle-items"
            checked={showItems}
            onCheckedChange={setShowItems}
            className="scale-75"
          />
          <Label htmlFor="toggle-items" className="text-xs cursor-pointer">
            明細を展開
          </Label>
        </div>
      </div>

      {/* カテゴリ別 */}
      <div className="space-y-3">
        {visibleCategories.map((c) => (
          <CategoryBreakdown
            key={c.id}
            category={c.id}
            categoryLabel={c.label}
            total={categoryTotals[c.id]}
            details={details.filter((d) => d.category === c.id)}
            gTemplate={gTemplates.find((t) => t.id === gMap[c.id]) ?? null}
            margin={marginMap[c.id] ?? 0}
            showFormula={showFormula}
            showItems={showItems}
          />
        ))}
      </div>

      <Separator />

      {/* 合計 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">中計合計（丸め前）</span>
          <span className="font-mono tabular-nums">¥ {fmt(grandTotal)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium">合計</span>
          <span className="font-mono font-bold text-xl tabular-nums">
            ¥ {fmt(roundedTotal)}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground text-right">
          丸め方式: <span className="font-mono">{roundingMethod}</span> / 桁数:{" "}
          <span className="font-mono">{roundingDigits}</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// カテゴリ別ブロック
// ────────────────────────────────────────────────────────────────────
interface CategoryBreakdownProps {
  category: QuoteCategory;
  categoryLabel: string;
  total: number;
  details: QuoteDetail[];
  gTemplate: FormulaTemplate | null;
  margin: number;
  showFormula: boolean;
  showItems: boolean;
}

function CategoryBreakdown({
  category,
  categoryLabel,
  total,
  details,
  gTemplate,
  margin,
  showFormula,
  showItems,
}: CategoryBreakdownProps) {
  const subtotalsSum = details.reduce(
    (a, d) => a + (d.final_value ?? d.computed_value ?? 0),
    0
  );
  const transportSum = details.reduce(
    (a, d) => a + (d.transport_cost ?? 0),
    0
  );
  const builtinKey = gTemplate?.builtin_key ?? "G_pass";

  // 式の文字列表現
  const formulaText = (() => {
    if (builtinKey === "G_outsource") {
      return `${fmt(subtotalsSum)} + ${fmt(transportSum)} = ${fmt(total)}`;
    }
    if (builtinKey === "G_margin") {
      return `${fmt(subtotalsSum)} × (1 + ${margin}) = ${fmt(total)}`;
    }
    return `${fmt(subtotalsSum)} = ${fmt(total)}`;
  })();

  const hasDetails = details.length > 0;

  return (
    <div className="rounded-md border border-border/60 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <span className="font-medium">{categoryLabel}</span>
        {gTemplate && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
            {gTemplate.name}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {details.length}件
        </span>
        <span className="font-mono tabular-nums font-semibold">
          ¥ {fmt(total)}
        </span>
      </div>

      {/* G式の詳細 */}
      {showFormula && hasDetails && (
        <div className="px-3 pb-2 -mt-1 text-[11px] font-mono text-muted-foreground bg-muted/20">
          {formulaText}
        </div>
      )}

      {/* 明細展開 */}
      {showItems && hasDetails && (
        <div className="px-3 py-2 border-t border-border/60 space-y-1 bg-muted/10">
          {details.map((d, i) => (
            <DetailLine key={d.id} index={i + 1} category={category} detail={d} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 明細1行（path label + subtotal）
// ────────────────────────────────────────────────────────────────────
function DetailLine({
  index,
  category,
  detail,
}: {
  index: number;
  category: QuoteCategory;
  detail: QuoteDetail;
}) {
  const { data: nodes } = useSelectionTreeNodes(category);
  const path = (detail.selection_path ?? []) as string[];
  const labels = path
    .map((id) => nodes?.find((n) => n.id === id)?.label)
    .filter(Boolean) as string[];

  const overridden =
    (detail.multiplier ?? 1) !== 1 ||
    (detail.adjustment ?? 0) !== 0 ||
    detail.override_value != null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground tabular-nums w-4">{index}</span>
      <span className="truncate flex-1 min-w-0 text-muted-foreground">
        {labels.length > 0 ? labels.join(" / ") : <em>未設定</em>}
      </span>
      {overridden && (
        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
          上書き
        </span>
      )}
      <span className="font-mono tabular-nums">
        ¥ {fmt(detail.final_value ?? detail.computed_value ?? 0)}
      </span>
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
