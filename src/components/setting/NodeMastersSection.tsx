import { Separator } from "@/components/ui/separator";

export function NodeMastersSection() {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h3 className="text-lg font-semibold">ノードマスタ</h3>
        <p className="text-sm text-muted-foreground mt-1">
          選択肢の木で使う「種類」と「具体値」を管理
        </p>
      </div>
      <Separator />
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        この画面は今後実装予定です
      </div>
    </div>
  );
}
