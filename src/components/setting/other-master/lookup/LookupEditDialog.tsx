import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
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
  useCreateLookupTable,
  useUpdateLookupTable,
  MATCH_TYPES,
  type LookupTable,
  type AxisDefinition,
  type MatchType,
} from "@/hooks/useLookupTables";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: LookupTable | null;
}

export function LookupEditDialog({ open, onOpenChange, target }: Props) {
  const isEdit = !!target;
  const createTable = useCreateLookupTable();
  const updateTable = useUpdateLookupTable();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [axes, setAxes] = useState<AxisDefinition[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(target?.name ?? "");
    setDescription(target?.description ?? "");
    const initialAxes = Array.isArray(target?.axes)
      ? (target!.axes as unknown as AxisDefinition[])
      : [];
    setAxes(
      initialAxes
        .slice()
        .sort((a, b) => (a.axis_order ?? 0) - (b.axis_order ?? 0))
    );
  }, [open, target]);

  const addAxis = () => {
    setAxes((prev) => [
      ...prev,
      {
        variable_code: "",
        match_type: "EXACT",
        axis_order: prev.length + 1,
      },
    ]);
  };

  const updateAxis = (i: number, patch: Partial<AxisDefinition>) => {
    setAxes((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  const removeAxis = (i: number) => {
    setAxes((prev) =>
      prev
        .filter((_, idx) => idx !== i)
        .map((a, idx) => ({ ...a, axis_order: idx + 1 }))
    );
  };

  const moveAxis = (i: number, dir: "up" | "down") => {
    setAxes((prev) => {
      const next = [...prev];
      const target = dir === "up" ? i - 1 : i + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next.map((a, idx) => ({ ...a, axis_order: idx + 1 }));
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    if (axes.some((a) => !a.variable_code.trim())) {
      toast.error("軸の variable_code を入力してください");
      return;
    }
    const codes = axes.map((a) => a.variable_code.trim());
    if (new Set(codes).size !== codes.length) {
      toast.error("軸の variable_code が重複しています");
      return;
    }
    const normalized = axes.map((a, i) => ({
      ...a,
      variable_code: a.variable_code.trim(),
      axis_order: i + 1,
    }));

    try {
      if (isEdit && target) {
        await updateTable.mutateAsync({
          id: target.id,
          name: name.trim(),
          description: description.trim() || null,
          axes: normalized,
        });
        toast.success("更新しました");
      } else {
        await createTable.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          axes: normalized,
        });
        toast.success("作成しました");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createTable.isPending || updateTable.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ルックアップ編集" : "ルックアップ新規作成"}</DialogTitle>
          <DialogDescription>
            軸（マッチ条件）と返り値で値を引き合わせるテーブルを定義します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              名前<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 歩留まり表"
            />
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

          <Separator />

          <div className="space-y-2">
            <Label>軸定義</Label>
            <p className="text-xs text-muted-foreground">
              variable_code: 変数のコードまたはパスキー（例: <code className="font-mono">d</code>, <code className="font-mono">material_title</code>）
            </p>
          </div>

          <div className="space-y-2">
            {axes.length === 0 && (
              <p className="text-sm text-muted-foreground italic px-2 py-3">
                軸がありません
              </p>
            )}
            {axes.map((axis, i) => (
              <div key={i} className="rounded-md border p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="variable_code"
                    value={axis.variable_code}
                    onChange={(e) => updateAxis(i, { variable_code: e.target.value })}
                    className="font-mono text-sm"
                  />
                  <Select
                    value={axis.match_type}
                    onValueChange={(v) => updateAxis(i, { match_type: v as MatchType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATCH_TYPES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => moveAxis(i, "up")}
                    disabled={i === 0}
                    aria-label="上へ"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => moveAxis(i, "down")}
                    disabled={i === axes.length - 1}
                    aria-label="下へ"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    順序: {axis.axis_order}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => removeAxis(i)}
                    aria-label="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addAxis}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              軸を追加
            </Button>
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
