import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  QUOTE_CATEGORIES,
  type QuoteCategory,
} from "@/hooks/useSelectionTreeNodes";
import {
  useQuoteFormulaSettings,
  useToggleEnabledCategory,
} from "@/hooks/useQuoteFormulaSettings";

interface Props {
  selectedCategory: QuoteCategory;
  onSelect: (category: QuoteCategory) => void;
}

export function CategoryList({ selectedCategory, onSelect }: Props) {
  const { data: settings } = useQuoteFormulaSettings();
  const toggleEnabled = useToggleEnabledCategory();
  const enabledCategories = (settings?.enabled_categories ?? []) as QuoteCategory[];

  const handleToggle = async (cat: QuoteCategory, next: boolean) => {
    if (!settings) return;
    try {
      await toggleEnabled.mutateAsync({
        id: settings.id,
        category: cat,
        currentEnabled: enabledCategories,
        enable: next,
      });
    } catch (e: any) {
      toast.error(e.message || "更新に失敗しました");
    }
  };

  return (
    <div className="w-64 border-r border-border flex flex-col shrink-0 bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">カテゴリ一覧</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {QUOTE_CATEGORIES.map((cat) => {
            const isEnabled = enabledCategories.includes(cat.id);
            return (
              <div
                key={cat.id}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                  "hover:bg-muted/50",
                  selectedCategory === cat.id ? "bg-muted font-medium" : "text-foreground"
                )}
                onClick={() => onSelect(cat.id)}
              >
                <span className="truncate">{cat.label}</span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(next) => handleToggle(cat.id, next)}
                  onClick={(e) => e.stopPropagation()}
                  className="scale-75"
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
