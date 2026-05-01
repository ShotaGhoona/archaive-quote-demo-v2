import { User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileSection() {
  const { user } = useAuth();

  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">プロフィール</h2>
            <p className="text-sm text-muted-foreground">アカウント情報を管理します</p>
          </div>
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

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">危険な操作</h3>
          <p className="text-sm text-muted-foreground">
            アカウントに対する取り消し不可能な操作
          </p>
          <Button variant="destructive" size="sm" className="mt-2">
            アカウント削除
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
