import { useState } from "react";
import { Building2, Search, Variable, Ruler } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const otherMasters = [
  { id: "customers", label: "取引先", icon: Building2 },
  { id: "lookup", label: "ルックアップ", icon: Search },
  { id: "variables", label: "変数", icon: Variable },
  { id: "units", label: "単位", icon: Ruler },
] as const;

type OtherMasterId = (typeof otherMasters)[number]["id"];

function MasterPlaceholder({ label }: { label: string }) {
  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {label}マスタの管理
        </p>
      </div>
      <Separator />
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        この画面は今後実装予定です
      </div>
    </div>
  );
}

export function OtherMastersSection() {
  const [active, setActive] = useState<OtherMasterId>("customers");
  const current = otherMasters.find((m) => m.id === active)!;

  return (
    <div className="flex gap-6">
      {/* サイドバー */}
      <nav className="w-48 shrink-0 space-y-1">
        {otherMasters.map((master) => (
          <button
            key={master.id}
            onClick={() => setActive(master.id)}
            className={cn(
              "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active === master.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <master.icon className="h-4 w-4" />
            {master.label}
          </button>
        ))}
      </nav>

      {/* コンテンツ */}
      <div className="flex-1 min-w-0">
        <MasterPlaceholder label={current.label} />
      </div>
    </div>
  );
}
