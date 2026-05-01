import { Palette } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
  { value: "system", label: "システム" },
] as const;

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">テーマ設定</h2>
            <p className="text-sm text-muted-foreground">アプリの外観を変更します</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-accent",
                theme === option.value
                  ? "border-primary bg-accent"
                  : "border-transparent"
              )}
            >
              <div
                className={cn(
                  "h-16 w-full rounded-md border",
                  option.value === "light" && "bg-white",
                  option.value === "dark" && "bg-zinc-900",
                  option.value === "system" &&
                    "bg-gradient-to-r from-white to-zinc-900"
                )}
              />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
