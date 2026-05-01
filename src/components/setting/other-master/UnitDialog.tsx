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
import { toast } from "sonner";
import {
  useCreateUnit,
  useUpdateUnit,
  type Unit,
} from "@/hooks/useUnits";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: Unit | null;
}

export function UnitDialog({ open, onOpenChange, target }: Props) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const isEdit = !!target;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dimension, setDimension] = useState("");

  useEffect(() => {
    if (!open) return;
    setCode(target?.code ?? "");
    setName(target?.name ?? "");
    setDimension(target?.dimension ?? "");
  }, [open, target]);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("コードと名称は必須です");
      return;
    }
    try {
      if (isEdit && target) {
        await updateUnit.mutateAsync({
          id: target.id,
          code: code.trim(),
          name: name.trim(),
          dimension: dimension.trim() || null,
        });
        toast.success("更新しました");
      } else {
        await createUnit.mutateAsync({
          code: code.trim(),
          name: name.trim(),
          dimension: dimension.trim() || null,
        });
        toast.success("追加しました");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createUnit.isPending || updateUnit.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "単位の編集" : "単位の追加"}</DialogTitle>
          <DialogDescription>計算式や明細で使用する単位を定義します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              コード<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: kg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">
              名称<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: キログラム"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dimension">区分</Label>
            <Input
              id="dimension"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              placeholder="例: 質量 / 長さ / 時間 / 個数 / 金額"
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
