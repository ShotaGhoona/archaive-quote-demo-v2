import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TITLE_ATTRIBUTE, type NodeMasterValueData } from "@/types/nodeMaster";
import type { NodeMaster } from "@/hooks/useNodeMasters";
import {
  useCreateNodeMasterValue,
  useUpdateNodeMasterValue,
  type NodeMasterValue,
} from "@/hooks/useNodeMasterValues";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeMaster: NodeMaster;
  /** 編集対象。null なら新規作成 */
  target: NodeMasterValue | null;
}

type FormValues = Record<string, string | number | boolean | "">;

export function NodeMasterValueDialog({ open, onOpenChange, nodeMaster, target }: Props) {
  const createValue = useCreateNodeMasterValue();
  const updateValue = useUpdateNodeMasterValue();
  const isEdit = !!target;

  const schema = [TITLE_ATTRIBUTE, ...nodeMaster.attribute_schema.filter((a) => a.key !== "title")];

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    const defaults: FormValues = {};
    for (const attr of schema) {
      const v = target?.values[attr.key];
      if (attr.type === "BOOLEAN") {
        defaults[attr.key] = v === true;
      } else if (v === undefined || v === null) {
        defaults[attr.key] = "";
      } else {
        defaults[attr.key] = v as string | number | boolean;
      }
    }
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.id, nodeMaster.id]);

  const onSubmit = async (values: FormValues) => {
    const cleaned: NodeMasterValueData = {};
    for (const attr of schema) {
      const raw = values[attr.key];
      if (attr.type === "NUMBER") {
        if (raw === "" || raw === null || raw === undefined) {
          if (attr.required) {
            toast.error(`${attr.label}は必須です`);
            return;
          }
          cleaned[attr.key] = null;
        } else {
          const n = Number(raw);
          if (Number.isNaN(n)) {
            toast.error(`${attr.label}は数値で入力してください`);
            return;
          }
          cleaned[attr.key] = n;
        }
      } else if (attr.type === "BOOLEAN") {
        cleaned[attr.key] = !!raw;
      } else {
        const s = String(raw ?? "").trim();
        if (!s && attr.required) {
          toast.error(`${attr.label}は必須です`);
          return;
        }
        cleaned[attr.key] = s || null;
      }
    }

    try {
      if (isEdit && target) {
        await updateValue.mutateAsync({
          id: target.id,
          node_master_id: nodeMaster.id,
          values: cleaned,
        });
        toast.success("更新しました");
      } else {
        await createValue.mutateAsync({
          node_master_id: nodeMaster.id,
          values: cleaned,
        });
        toast.success("追加しました");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createValue.isPending || updateValue.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {nodeMaster.name} — {isEdit ? "値の編集" : "値の追加"}
          </DialogTitle>
          <DialogDescription>
            属性スキーマに従って値を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {schema.map((attr) => (
            <div key={attr.key} className="space-y-2">
              <Label htmlFor={attr.key}>
                {attr.label}
                {attr.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {attr.type === "STRING" && (
                <Input
                  id={attr.key}
                  {...register(attr.key, { required: attr.required })}
                />
              )}

              {attr.type === "NUMBER" && (
                <Input
                  id={attr.key}
                  type="number"
                  step="any"
                  {...register(attr.key, { required: attr.required })}
                />
              )}

              {attr.type === "BOOLEAN" && (
                <Controller
                  name={attr.key}
                  control={control}
                  render={({ field }) => (
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  )}
                />
              )}

              {attr.type === "SELECT" && (
                <Controller
                  name={attr.key}
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {(attr.options ?? []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}

              {errors[attr.key] && (
                <p className="text-xs text-destructive">{attr.label}は必須です</p>
              )}
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
