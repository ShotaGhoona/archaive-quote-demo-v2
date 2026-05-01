import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/setting/ProfileSection";
import { ThemeSection } from "@/components/setting/ThemeSection";
import { CategoriesSection } from "@/components/setting/CategoriesSection";
import { NodeMastersSection } from "@/components/setting/NodeMastersSection";
import { OtherMastersSection } from "@/components/setting/OtherMastersSection";

const userSettingsTabs = [
  { id: "profile", label: "プロフィール" },
  { id: "theme", label: "テーマ設定" },
] as const;

const quoteSettingsTabs = [
  { id: "categories", label: "カテゴリ別設定" },
  { id: "node-masters", label: "ノードマスタ" },
  { id: "other-masters", label: "その他マスタ" },
] as const;

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export default function Settings() {
  const [userTab, setUserTab] = useState<(typeof userSettingsTabs)[number]["id"]>("profile");
  const [quoteTab, setQuoteTab] = useState<(typeof quoteSettingsTabs)[number]["id"]>("categories");

  return (
    <AppLayout>
      <PageHeader title="設定" description="アプリケーションの設定を管理" />
      <Tabs defaultValue="user" className="space-y-6">
        {/* 1段目: トップタブ */}
        <div className="border-b">
          <TabsList className="h-auto p-0 bg-transparent rounded-none gap-6">
            <TabsTrigger value="user" className={tabTriggerClass}>
              ユーザー設定
            </TabsTrigger>
            <TabsTrigger value="quote" className={tabTriggerClass}>
              見積もり設定
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ユーザー設定 */}
        <TabsContent value="user">
          <Tabs
            value={userTab}
            onValueChange={(v) => setUserTab(v as typeof userTab)}
            className="space-y-6"
          >
            <div className="border-b">
              <TabsList className="h-auto p-0 bg-transparent rounded-none gap-6">
                {userSettingsTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className={tabTriggerClass}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>
            <TabsContent value="theme">
              <ThemeSection />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 見積もり設定 */}
        <TabsContent value="quote">
          <Tabs
            value={quoteTab}
            onValueChange={(v) => setQuoteTab(v as typeof quoteTab)}
            className="space-y-6"
          >
            <div className="border-b">
              <TabsList className="h-auto p-0 bg-transparent rounded-none gap-6">
                {quoteSettingsTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className={tabTriggerClass}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="categories">
              <CategoriesSection />
            </TabsContent>
            <TabsContent value="node-masters">
              <NodeMastersSection />
            </TabsContent>
            <TabsContent value="other-masters">
              <OtherMastersSection />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
