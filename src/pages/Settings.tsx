import { useState, type ComponentType } from "react";
import {
  Settings as SettingsIcon,
  User,
  Calculator,
  Palette,
  Layers,
  Network,
  Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { ProfileSection } from "@/components/setting/ProfileSection";
import { ThemeSection } from "@/components/setting/ThemeSection";
import { CategoriesSection } from "@/components/setting/CategoriesSection";
import { NodeMastersSection } from "@/components/setting/NodeMastersSection";
import { OtherMastersSection } from "@/components/setting/OtherMastersSection";

interface SubTab {
  id: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

interface SettingsCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  subTabs: SubTab[];
}

const settingsCategories: SettingsCategory[] = [
  {
    id: "user",
    label: "ユーザー設定",
    icon: User,
    subTabs: [
      { id: "profile", label: "プロフィール", icon: User, component: ProfileSection },
      { id: "theme", label: "テーマ設定", icon: Palette, component: ThemeSection },
    ],
  },
  {
    id: "quote",
    label: "見積もり設定",
    icon: Calculator,
    subTabs: [
      { id: "categories", label: "カテゴリ別設定", icon: Layers, component: CategoriesSection },
      { id: "node-masters", label: "ノードマスタ", icon: Network, component: NodeMastersSection },
      { id: "other-masters", label: "その他マスタ", icon: Database, component: OtherMastersSection },
    ],
  },
];

export default function Settings() {
  const [activeCategoryId, setActiveCategoryId] = useState("user");
  const [activeSubTabIds, setActiveSubTabIds] = useState<Record<string, string>>({
    user: "profile",
    quote: "categories",
  });

  const activeCategory = settingsCategories.find((c) => c.id === activeCategoryId)!;
  const activeSubTabId = activeSubTabIds[activeCategoryId];
  const activeSubTab =
    activeCategory.subTabs.find((t) => t.id === activeSubTabId) ?? activeCategory.subTabs[0];
  const ActiveComponent = activeSubTab.component;

  const setSubTab = (subTabId: string) => {
    setActiveSubTabIds((prev) => ({ ...prev, [activeCategoryId]: subTabId }));
  };

  return (
    <AppLayout>
      <div className="-m-6 flex flex-col h-full bg-card">
        {/* Top-level category tabs */}
        <div className="border-b border-border px-6 pt-4 pb-0 shrink-0 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-base font-semibold text-foreground">設定</h1>
          </div>
          <nav className="flex gap-1 -mb-px">
            {settingsCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors",
                    activeCategoryId === cat.id
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-border px-6 pt-3 pb-0 shrink-0 bg-card">
          <nav className="flex gap-1 -mb-px">
            {activeCategory.subTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors",
                    activeSubTab.id === tab.id
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ActiveComponent />
        </div>
      </div>
    </AppLayout>
  );
}
