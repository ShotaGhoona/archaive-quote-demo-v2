import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCreateLookupRow,
  useUpdateLookupRow,
  INTERPOLATIONS,
  type LookupRow,
  type Interpolation,
} from "@/hooks/useLookupRows";
import type { AxisDefinition } from "@/hooks/useLookupTables";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
  axes: AxisDefinition[];
  target: LookupRow | null;
}

type FormConditions = Record<string, string>;

export function LookupRowDialog({
  open,
  onOpenChange,
  versionId,
  axes,
  target,
}: Props) {
  const isEdit = !!target;
  const createRow = useCreateLookupRow();
  const updateRow = useUpdateLookupRow();

  const [conditions, setConditions] = useState<FormConditions>({});
  const [returnValue, setReturnValue] = useState("");
  const [returnValueMax, setReturnValueMax] = useState("");
  const [interpolation, setInterpolation] = useState<Interpolation>("CONSTANT");

  useEffect(() => {
    if (!open) return;
    const initial: FormConditions = {};
    const targetCond =
      (target?.conditions as Record<string, unknown> | null) ?? {};

    for (const axis of axes) {
      if (axis.match_type === "RANGE") {
        initial[`${axis.variable_code}_min`] = String(
          targetCond[`${axis.variable_code}_min`] ?? ""
        );
        initial[`${axis.variable_code}_max`] = String(
          targetCond[`${axis.variable_code}_max`] ?? ""
        );
      } else {
        initial[axis.variable_code] = String(
          targetCond[axis.variable_code] ?? ""
        );
      }
    }
    setConditions(initial);
    setReturnValue(target?.return_value != null ? String(target.return_value) : "");
    setReturnValueMax(
      target?.return_value_max != null ? String(target.return_value_max) : ""
    );
    setInterpolation((target?.interpolation as Interpolation) ?? "CONSTANT");
  }, [open, target, axes]);

  const handleSubmit = async () => {
    // 軸条件をパース
    const cond: Record<string, unknown> = {};
    for (const axis of axes) {
      if (axis.match_type === "RANGE") {
        const min = conditions[`${axis.variable_code}_min`]?.trim() ?? "";
        const max = conditions[`${axis.variable_code}_max`]?.trim() ?? "";
        if (!min || !max) {
          toast.error(`${axis.variable_code} の min/max は必須です`);
          return;
        }
        const minN = Number(min);
        const maxN = Number(max);
        if (Number.isNaN(minN) || Number.isNaN(maxN)) {
          toast.error(`${axis.variable_code} は数値で入力してください`);
          return;
        }
        cond[`${axis.variable_code}_min`] = minN;
        cond[`${axis.variable_code}_max`] = maxN;
      } else {
        const val = conditions[axis.variable_code]?.trim() ?? "";
        if (!val) {
          toast.error(`${axis.variable_code} は必須です`);
          return;
        }
        // 数値変換できれば数値、それ以外は文字列
        const n = Number(val);
        cond[axis.variable_code] = !Number.isNaN(n) && val !== "" ? n : val;
      }
    }

    const rv = Number(returnValue);
    if (!returnValue.trim() || Number.isNaN(rv)) {
      toast.error("返り値は数値で必須です");
      return;
    }
    let rvMax: number | null = null;
    if (interpolation === "LINEAR") {
      if (!returnValueMax.trim()) {
        toast.error("LINEAR の場合 return_value_max は必須です");
        return;
      }
      const n = Number(returnValueMax);
      if (Number.isNaN(n)) {
        toast.error("return_value_max は数値で入力してください");
        return;
      }
      rvMax = n;
    }

    try {
      if (isEdit && target) {
        await updateRow.mutateAsync({
          id: target.id,
          version_id: versionId,
          conditions: cond,
          return_value: rv,
          return_value_max: rvMax,
          interpolation,
        });
        toast.success("更新しました");
      } else {
        await createRow.mutateAsync({
          version_id: versionId,
          conditions: cond,
          return_value: rv,
          return_value_max: rvMax,
          interpolation,
        });
        toast.success("追加しました");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createRow.isPending || updateRow.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "行の編集" : "行の追加"}</DialogTitle>
          <DialogDescription>
            軸条件と返り値を入力します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {axes.map((axis) => (
            <div key={axis.variable_code} className="space-y-2">
              <Label className="font-mono text-xs">
                {axis.variable_code}{" "}
                <span className="text-muted-foreground font-normal not-italic">
                  ({axis.match_type})
                </span>
              </Label>
              {axis.match_type === "RANGE" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="min"
                    value={conditions[`${axis.variable_code}_min`] ?? ""}
                    onChange={(e) =>
                      setConditions((prev) => ({
                        ...prev,
                        [`${axis.variable_code}_min`]: e.target.value,
                      }))
                    }
                    type="number"
                    step="any"
                  />
                  <Input
                    placeholder="max"
                    value={conditions[`${axis.variable_code}_max`] ?? ""}
                    onChange={(e) =>
                      setConditions((prev) => ({
                        ...prev,
                        [`${axis.variable_code}_max`]: e.target.value,
                      }))
                    }
                    type="number"
                    step="any"
                  />
                </div>
              ) : (
                <Input
                  value={conditions[axis.variable_code] ?? ""}
                  onChange={(e) =>
                    setConditions((prev) => ({
                      ...prev,
                      [axis.variable_code]: e.target.value,
                    }))
                  }
                  placeholder={axis.match_type === "EXACT" ? "値" : "前方一致パターン"}
                />
              )}
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <Label>補間種別</Label>
            <Select
              value={interpolation}
              onValueChange={(v) => setInterpolation(v as Interpolation)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERPOLATIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="return_value">
                返り値<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="return_value"
                value={returnValue}
                onChange={(e) => setReturnValue(e.target.value)}
                type="number"
                step="any"
              />
            </div>
            {interpolation === "LINEAR" && (
              <div className="space-y-2">
                <Label htmlFor="return_value_max">
                  返り値（上端）<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="return_value_max"
                  value={returnValueMax}
                  onChange={(e) => setReturnValueMax(e.target.value)}
                  type="number"
                  step="any"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
