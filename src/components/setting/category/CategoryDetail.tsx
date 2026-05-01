import { Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  QUOTE_CATEGORIES,
  type QuoteCategory,
} from "@/hooks/useSelectionTreeNodes";
import {
  useQuoteFormulaSettings,
  useToggleEnabledCategory,
} from "@/hooks/useQuoteFormulaSettings";
import { SelectionTreeColumnView } from "./SelectionTreeColumnView";

interface Props {
  category: QuoteCategory;
}

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export function CategoryDetail({ category }: Props) {
  const { data: settings } = useQuoteFormulaSettings();
  const toggleEnabled = useToggleEnabledCategory();
  const meta = QUOTE_CATEGORIES.find((c) => c.id === category)!;

  const enabledCategories = (settings?.enabled_categories ?? []) as QuoteCategory[];
  const isEnabled = enabledCategories.includes(category);

  const handleToggle = async (next: boolean) => {
    if (!settings) return;
    try {
      await toggleEnabled.mutateAsync({
        id: settings.id,
        category,
        currentEnabled: enabledCategories,
        enable: next,
      });
      toast.success(next ? "有効化しました" : "無効化しました");
    } catch (e: any) {
      toast.error(e.message || "更新に失敗しました");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto w-full px-6 pt-6 space-y-6 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {meta.label} 設定
              </h2>
              <p className="text-sm text-muted-foreground">
                選択肢の木と計算式を管理
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="enabled"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={toggleEnabled.isPending}
            />
            <Label htmlFor="enabled" className="text-sm">
              {isEnabled ? "有効" : "無効"}
            </Label>
          </div>
        </div>

        <Separator />
      </div>

      <Tabs defaultValue="tree" className="flex-1 min-h-0 flex flex-col">
        <div className="border-b shrink-0">
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <TabsList className="h-auto p-0 bg-transparent rounded-none gap-6">
              <TabsTrigger value="tree" className={tabTriggerClass}>
                選択肢の木
              </TabsTrigger>
              <TabsTrigger value="formula-templates" className={tabTriggerClass}>
                計算式テンプレート
              </TabsTrigger>
              <TabsTrigger value="g-formula" className={tabTriggerClass}>
                G の式
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="tree" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <div className="max-w-6xl mx-auto h-full px-6 py-6">
            <SelectionTreeColumnView category={category} />
          </div>
        </TabsContent>

        <TabsContent value="formula-templates" className="mt-0">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              計算式テンプレート編集は今後実装予定です
            </div>
          </div>
        </TabsContent>

        <TabsContent value="g-formula" className="mt-0">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              G の式設定は今後実装予定です
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
