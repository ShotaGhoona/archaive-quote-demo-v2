import { Layers } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CategoriesSection() {
  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">カテゴリ別設定</h2>
            <p className="text-sm text-muted-foreground">
              見積カテゴリごとの選択肢の木と計算式を管理
            </p>
          </div>
        </div>

        <Separator />

        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          この画面は今後実装予定です
        </div>
      </div>
    </ScrollArea>
  );
}
