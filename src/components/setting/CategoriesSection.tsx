import { Separator } from "@/components/ui/separator";

export function CategoriesSection() {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h3 className="text-lg font-semibold">カテゴリ別設定</h3>
        <p className="text-sm text-muted-foreground mt-1">
          見積カテゴリごとの選択肢の木と計算式を管理
        </p>
      </div>
      <Separator />
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        この画面は今後実装予定です
      </div>
    </div>
  );
}
