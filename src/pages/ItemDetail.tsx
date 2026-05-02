import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileImage, Package } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useItem } from "@/hooks/useItems";
import { useEnsureQuote } from "@/hooks/useQuotes";
import { QuotePanel } from "@/components/quote/QuotePanel";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id!);
  // item が確定してから quote 作成を走らせる
  const { data: quoteData, isLoading: loadingQuote } = useEnsureQuote(
    item?.id ?? null
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full overflow-auto p-6">
          <PageSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="h-full overflow-auto p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">アイテムが見つかりません</p>
            <Button variant="link" onClick={() => navigate("/items")}>
              一覧に戻る
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/items")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              一覧
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="secondary" className="font-mono">
              {item.item_code}
            </Badge>
            <h1 className="text-base font-semibold">{item.name}</h1>
            <span className="text-xs text-muted-foreground ml-auto">
              {item.customer?.name ?? "-"}
            </span>
          </div>
        </div>

        {/* Body: 2 cards */}
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 p-4 overflow-hidden">
          {/* Left card: 図面プレビュー */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                図面プレビュー
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex items-center justify-center">
              <div className="text-center text-sm text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <div>図面プレースホルダー</div>
                <div className="text-xs mt-1 italic opacity-70">
                  （アップロード機能は今後実装）
                </div>
                {item.remarks && (
                  <div className="mt-6 max-w-sm mx-auto text-left">
                    <div className="text-xs text-muted-foreground mb-1">備考</div>
                    <div className="text-xs whitespace-pre-wrap">{item.remarks}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right card: 見積もりパネル */}
          <Card className="flex flex-col overflow-hidden p-0">
            {loadingQuote || !quoteData ? (
              <div className="p-4">
                <PageSkeleton />
              </div>
            ) : (
              <QuotePanel quoteLotId={quoteData.lot.id} />
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
