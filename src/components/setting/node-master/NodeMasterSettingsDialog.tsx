import { useEffect, useState } from "react";
import { Plus, Trash2, Lock } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ATTRIBUTE_TYPES,
  TITLE_ATTRIBUTE,
  type AttributeDefinition,
} from "@/types/nodeMaster";
import {
  useUpdateNodeMaster,
  useDeleteNodeMaster,
  type NodeMaster,
} from "@/hooks/useNodeMasters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeMaster: NodeMaster;
  onDeleted?: () => void;
}

export function NodeMasterSettingsDialog({
  open,
  onOpenChange,
  nodeMaster,
  onDeleted,
}: Props) {
  const updateNodeMaster = useUpdateNodeMaster();
  const deleteNodeMaster = useDeleteNodeMaster();

  const [name, setName] = useState(nodeMaster.name);
  const [description, setDescription] = useState(nodeMaster.description ?? "");
  const [extraAttrs, setExtraAttrs] = useState<AttributeDefinition[]>(
    nodeMaster.attribute_schema.filter((a) => a.key !== "title")
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(nodeMaster.name);
    setDescription(nodeMaster.description ?? "");
    setExtraAttrs(nodeMaster.attribute_schema.filter((a) => a.key !== "title"));
  }, [open, nodeMaster]);

  const addAttr = () => {
    setExtraAttrs((prev) => [
      ...prev,
      { key: "", label: "", type: "STRING", required: false },
    ]);
  };

  const updateAttr = (i: number, patch: Partial<AttributeDefinition>) => {
    setExtraAttrs((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  const removeAttr = (i: number) => {
    setExtraAttrs((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("種類名を入力してください");
      return;
    }
    const keys = extraAttrs.map((a) => a.key.trim());
    if (keys.some((k) => !k)) {
      toast.error("属性のキーを入力してください");
      return;
    }
    if (new Set(keys).size !== keys.length || keys.includes("title")) {
      toast.error("属性のキーが重複しています（title は使用できません）");
      return;
    }
    if (extraAttrs.some((a) => !a.label.trim())) {
      toast.error("属性のラベルを入力してください");
      return;
    }

    try {
      await updateNodeMaster.mutateAsync({
        id: nodeMaster.id,
        name: name.trim(),
        description: description.trim() || null,
        attribute_schema: [TITLE_ATTRIBUTE, ...extraAttrs],
      });
      toast.success("更新しました");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNodeMaster.mutateAsync(nodeMaster.id);
      toast.success("削除しました");
      setConfirmDeleteOpen(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{nodeMaster.name} — 設定</DialogTitle>
            <DialogDescription>
              種類名・説明・属性を編集します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                種類名<span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <Label>持つ属性</Label>
              <p className="text-xs text-muted-foreground">
                title 属性は固定で必須です
              </p>
            </div>

            <div className="space-y-2">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs flex items-center gap-2">
                <Lock className="h-3 w-3" />
                <span className="font-mono">title</span>
                <span className="text-muted-foreground">タイトル / 必須 / 文字列 / 固定</span>
              </div>

              {extraAttrs.map((attr, i) => (
                <div key={i} className="rounded-md border p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="key (例: density)"
                      value={attr.key}
                      onChange={(e) => updateAttr(i, { key: e.target.value })}
                    />
                    <Input
                      placeholder="ラベル (例: 比重)"
                      value={attr.label}
                      onChange={(e) => updateAttr(i, { label: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={attr.type}
                      onValueChange={(v) =>
                        updateAttr(i, { type: v as AttributeDefinition["type"] })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRIBUTE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 ml-auto">
                      <Label htmlFor={`req-${i}`} className="text-xs">必須</Label>
                      <Switch
                        id={`req-${i}`}
                        checked={attr.required}
                        onCheckedChange={(c) => updateAttr(i, { required: c })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttr(i)}
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={addAttr}>
                <Plus className="h-4 w-4 mr-2" />
                属性を追加
              </Button>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={updateNodeMaster.isPending}
            >
              ノードマスタを削除
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={updateNodeMaster.isPending}>
                {updateNodeMaster.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ノードマスタを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{nodeMaster.name}」と紐づく値もすべて削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteNodeMaster.isPending}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
