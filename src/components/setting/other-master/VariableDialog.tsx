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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCreateVariableDefinition,
  useUpdateVariableDefinition,
  VARIABLE_TYPES,
  VARIABLE_SOURCES,
  type VariableDefinition,
} from "@/hooks/useVariableDefinitions";
import { useUnits } from "@/hooks/useUnits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: VariableDefinition | null;
}

const UNIT_NONE = "__none__";

export function VariableDialog({ open, onOpenChange, target }: Props) {
  const createVar = useCreateVariableDefinition();
  const updateVar = useUpdateVariableDefinition();
  const { data: units } = useUnits();
  const isEdit = !!target;

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<string>("NUMBER");
  const [source, setSource] = useState<string>("MANUAL");
  const [unitId, setUnitId] = useState<string>(UNIT_NONE);
  const [required, setRequired] = useState(true);
  const [pathKey, setPathKey] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setCode(target?.code ?? "");
    setLabel(target?.label ?? "");
    setType(target?.type ?? "NUMBER");
    setSource(target?.source ?? "MANUAL");
    setUnitId(target?.unit_id ?? UNIT_NONE);
    setRequired(target?.required ?? true);
    setPathKey((target as VariableDefinition & { path_key?: string | null })?.path_key ?? "");
    setDefaultValue(
      target?.default_value === null || target?.default_value === undefined
        ? ""
        : String(target.default_value)
    );
    setDescription(target?.description ?? "");
  }, [open, target]);

  const handleSubmit = async () => {
    if (!code.trim() || !label.trim()) {
      toast.error("コードとラベルは必須です");
      return;
    }
    let defaultNum: number | null = null;
    if (defaultValue.trim()) {
      const n = Number(defaultValue);
      if (Number.isNaN(n)) {
        toast.error("デフォルト値は数値で入力してください");
        return;
      }
      defaultNum = n;
    }

    const payload = {
      code: code.trim(),
      label: label.trim(),
      type,
      source,
      unit_id: unitId === UNIT_NONE ? null : unitId,
      required,
      path_key: source === "PATH" ? pathKey.trim() || null : null,
      default_value: defaultNum,
      description: description.trim() || null,
    };

    try {
      if (isEdit && target) {
        await updateVar.mutateAsync({ id: target.id, ...payload });
        toast.success("更新しました");
      } else {
        await createVar.mutateAsync(payload);
        toast.success("追加しました");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createVar.isPending || updateVar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "変数の編集" : "変数の追加"}</DialogTitle>
          <DialogDescription>計算式で使用する変数を定義します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">
                コード<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例: d / L / rho"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">
                ラベル<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="例: 直径"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIABLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>単位</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNIT_NONE}>なし</SelectItem>
                  {units?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ソース</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIABLE_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {source === "MANUAL" && "ユーザーが手入力（図面から読み取る値など）"}
              {source === "LOOKUP" && "LOOKUPテーブルから引く"}
              {source === "PATH" && "選択肢の木の経路上のノードマスタ値から取得"}
            </p>
          </div>

          {source === "PATH" && (
            <div className="rounded-md border p-3 bg-muted/30 space-y-2">
              <Label htmlFor="path_key">参照キー</Label>
              <Input
                id="path_key"
                value={pathKey}
                onChange={(e) => setPathKey(e.target.value)}
                placeholder="例: density / unit_price / hourly_rate"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                経路上のノードマスタ値の <code className="font-mono">values</code> JSONB から、このキーで値を取得します
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="default_value">デフォルト値</Label>
              <Input
                id="default_value"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                type="number"
                step="any"
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch
                id="required"
                checked={required}
                onCheckedChange={setRequired}
              />
              <Label htmlFor="required">必須</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
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
