import { Separator } from "@/components/ui/separator";
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
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h3 className="text-lg font-semibold">テーマ設定</h3>
        <p className="text-sm text-muted-foreground mt-1">
          アプリの外観を変更します
        </p>
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
  );
}
