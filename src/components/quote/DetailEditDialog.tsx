import { useEffect, useState } from "react";
import { Calculator, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useUpdateQuoteDetail,
  type QuoteDetail,
} from "@/hooks/useQuotes";
import { applyOverrides } from "@/lib/quoteCalc";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: QuoteDetail;
}

function formatYen(v: number | null): string {
  if (v == null) return "—";
  return `¥ ${Math.round(v).toLocaleString("ja-JP")}`;
}

export function DetailEditDialog({ open, onOpenChange, detail }: Props) {
  const updateDetail = useUpdateQuoteDetail();

  const [multiplier, setMultiplier] = useState("1");
  const [adjustment, setAdjustment] = useState("0");
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideValue, setOverrideValue] = useState("");
  const [transportCost, setTransportCost] = useState("0");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) return;
    setMultiplier(String(detail.multiplier ?? 1));
    setAdjustment(String(detail.adjustment ?? 0));
    setOverrideEnabled(detail.override_value != null);
    setOverrideValue(
      detail.override_value != null ? String(detail.override_value) : ""
    );
    setTransportCost(String(detail.transport_cost ?? 0));
    setRemarks(detail.remarks ?? "");
  }, [open, detail]);

  // プレビュー計算
  const computed = detail.computed_value;
  const m = Number(multiplier);
  const a = Number(adjustment);
  const o = overrideEnabled && overrideValue !== "" ? Number(overrideValue) : null;
  const validInputs =
    !Number.isNaN(m) &&
    !Number.isNaN(a) &&
    (o === null || !Number.isNaN(o));
  const adjusted = computed != null && !Number.isNaN(m) && !Number.isNaN(a)
    ? computed * m + a
    : null;
  const finalPreview = applyOverrides(computed, m || 1, a || 0, o);

  const isOutsource = detail.category === "OUTSOURCE";

  const handleSubmit = async () => {
    if (!validInputs) {
      toast.error("数値の入力を確認してください");
      return;
    }
    const t = Number(transportCost);
    if (Number.isNaN(t)) {
      toast.error("運賃は数値で入力してください");
      return;
    }

    try {
      await updateDetail.mutateAsync({
        id: detail.id,
        quote_lot_id: detail.quote_lot_id,
        multiplier: m,
        adjustment: a,
        override_value: o,
        transport_cost: t,
        remarks: remarks.trim() || null,
        final_value: finalPreview,
      });
      toast.success("更新しました");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "更新に失敗しました");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            明細の編集
          </DialogTitle>
          <DialogDescription>
            倍率・加算・完全上書きで小計を調整できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 計算結果（参照） */}
          <div className="rounded-md border border-border p-3 bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calculator className="h-3.5 w-3.5" />
                計算結果
              </span>
              <span className="font-mono font-medium">{formatYen(computed)}</span>
            </div>
          </div>

          <Separator />

          {/* 上書き 3 レバー */}
          <div className="space-y-3">
            <Label className="text-sm">上書き 3 レバー</Label>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
              <Label htmlFor="multiplier" className="text-sm">
                倍率
              </Label>
              <Input
                id="multiplier"
                type="number"
                step="any"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                disabled={overrideEnabled}
                className="h-9"
              />
              <span className="text-xs text-muted-foreground">×</span>

              <Label htmlFor="adjustment" className="text-sm">
                加算
              </Label>
              <Input
                id="adjustment"
                type="number"
                step="any"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                disabled={overrideEnabled}
                className="h-9"
              />
              <span className="text-xs text-muted-foreground">円</span>
            </div>

            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="override" className="text-sm cursor-pointer">
                  完全上書き
                </Label>
                <Switch
                  id="override"
                  checked={overrideEnabled}
                  onCheckedChange={setOverrideEnabled}
                />
              </div>
              {overrideEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    placeholder="採用する値"
                    className="h-9"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">円</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {overrideEnabled
                  ? "計算結果と倍率/加算は無視され、上記の値がそのまま採用されます"
                  : "OFF: 計算結果 × 倍率 + 加算"}
              </p>
            </div>
          </div>

          {/* 運賃（外注のみ） */}
          {isOutsource && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="transport" className="text-sm">
                  運賃
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="transport"
                    type="number"
                    step="any"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="h-9"
                  />
                  <span className="text-xs text-muted-foreground">円</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  G_outsource 集計時に中計へ加算されます
                </p>
              </div>
            </>
          )}

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm">
              備考
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="メモなど"
            />
          </div>

          <Separator />

          {/* 採用値プレビュー */}
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-1.5">
            {!overrideEnabled && adjusted != null && computed != null && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>計算結果 × {multiplier} + {adjustment}</span>
                <span className="font-mono">{formatYen(adjusted)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">採用値（小計）</span>
              <span className="font-mono text-xl font-bold tabular-nums">
                {formatYen(finalPreview)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={updateDetail.isPending}>
            {updateDetail.isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
