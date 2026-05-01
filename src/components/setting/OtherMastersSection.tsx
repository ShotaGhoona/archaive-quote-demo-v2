import { useState } from "react";
import { Building2, Search, Variable, Ruler } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CustomersSection } from "./other-master/CustomersSection";
import { UnitsSection } from "./other-master/UnitsSection";
import { VariablesSection } from "./other-master/VariablesSection";
import { LookupSection } from "./other-master/lookup/LookupSection";

const otherMasters = [
  { id: "customers", label: "取引先", icon: Building2 },
  { id: "lookup", label: "ルックアップ", icon: Search },
  { id: "variables", label: "変数", icon: Variable },
  { id: "units", label: "単位", icon: Ruler },
] as const;

type OtherMasterId = (typeof otherMasters)[number]["id"];

function MasterPlaceholder({ label, Icon }: { label: string; Icon: LucideIcon }) {
  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{label}</h2>
            <p className="text-sm text-muted-foreground">{label}マスタの管理</p>
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

export function OtherMastersSection() {
  const [active, setActive] = useState<OtherMasterId>("customers");
  const current = otherMasters.find((m) => m.id === active)!;

  return (
    <div className="flex h-full">
      {/* Left list */}
      <div className="w-64 border-r border-border flex flex-col shrink-0 bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">マスタ</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {otherMasters.map((master) => {
              const Icon = master.icon;
              return (
                <button
                  key={master.id}
                  onClick={() => setActive(master.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-muted/50",
                    active === master.id ? "bg-muted font-medium" : "text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{master.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right detail */}
      <div className="flex-1 overflow-hidden">
        {active === "customers" && <CustomersSection />}
        {active === "units" && <UnitsSection />}
        {active === "variables" && <VariablesSection />}
        {active === "lookup" && <LookupSection />}
      </div>
    </div>
  );
}
