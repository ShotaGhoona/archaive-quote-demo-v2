import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ResolvedVariable } from "@/lib/quoteCalc";

interface Props {
  variables: ResolvedVariable[];
  onChange: (code: string, value: string) => void;
  /** 全フィールドを読み取り専用に（既存明細表示用） */
  readOnly?: boolean;
}

export function VariableInputArea({ variables, onChange, readOnly }: Props) {
  if (variables.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        この計算式は変数を要求しません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
      {variables.map((v) => (
        <div key={v.code} className="contents">
          <label
            htmlFor={`var-${v.code}`}
            className="text-sm font-medium whitespace-nowrap pr-2"
          >
            {v.label}
          </label>
          <div className="relative">
            <Input
              id={`var-${v.code}`}
              value={v.value == null ? "" : String(v.value)}
              onChange={(e) => onChange(v.code, e.target.value)}
              disabled={v.locked || readOnly}
              type={v.source === "MANUAL" ? "number" : "text"}
              step="any"
              className="h-9 text-sm pr-8"
              placeholder={
                v.locked && v.value == null ? "（解決できませんでした）" : undefined
              }
            />
            {v.locked && (
              <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
