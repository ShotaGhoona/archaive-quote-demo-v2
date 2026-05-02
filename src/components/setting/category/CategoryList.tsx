import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  QUOTE_CATEGORIES,
  type QuoteCategory,
} from "@/hooks/useSelectionTreeNodes";

interface Props {
  selectedCategory: QuoteCategory;
  onSelect: (category: QuoteCategory) => void;
}

export function CategoryList({ selectedCategory, onSelect }: Props) {
  return (
    <div className="w-64 border-r border-border flex flex-col shrink-0 bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">カテゴリ一覧</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {QUOTE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors text-left",
                "hover:bg-muted/50",
                selectedCategory === cat.id
                  ? "bg-muted font-medium"
                  : "text-foreground"
              )}
            >
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
