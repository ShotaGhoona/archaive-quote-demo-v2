import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileSection() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h3 className="text-lg font-semibold">プロフィール</h3>
        <p className="text-sm text-muted-foreground mt-1">アカウント情報</p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>メールアドレス</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>ユーザーID</Label>
          <Input value={user?.id || ""} disabled />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold">危険な操作</h3>
        <p className="text-sm text-muted-foreground mt-1">
          アカウントに対する取り消し不可能な操作
        </p>
        <Button variant="destructive" className="mt-4">
          アカウント削除
        </Button>
      </div>
    </div>
  );
}
