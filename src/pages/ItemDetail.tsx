import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useItem, useUpdateItem } from "@/hooks/useItems";
import { toast } from "sonner";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id!);
  const updateItem = useUpdateItem();
  const [name, setName] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setRemarks(item.remarks ?? "");
    }
  }, [item]);

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

  const handleSave = async () => {
    try {
      await updateItem.mutateAsync({ id: item.id, name, remarks });
      toast.success("保存しました");
    } catch (error: any) {
      toast.error(error.message || "保存に失敗しました");
    }
  };

  return (
    <AppLayout>
      <div className="h-full overflow-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/items")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            一覧に戻る
          </Button>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{item.item_code}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">品名</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">備考</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>取引先</Label>
                <p className="text-sm text-muted-foreground">
                  {item.customer?.name ?? "-"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>作成日</Label>
                <p className="text-sm text-muted-foreground">
                  {item.created_at ? new Date(item.created_at).toLocaleString("ja-JP") : "-"}
                </p>
              </div>
              <Button onClick={handleSave} disabled={updateItem.isPending}>
                {updateItem.isPending ? "保存中..." : "保存"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
