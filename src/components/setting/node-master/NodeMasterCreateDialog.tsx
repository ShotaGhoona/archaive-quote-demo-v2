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
import { toast } from "sonner";
import { TITLE_ATTRIBUTE } from "@/types/nodeMaster";
import { useCreateNodeMaster } from "@/hooks/useNodeMasters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NodeMasterCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const createNodeMaster = useCreateNodeMaster();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("種類名を入力してください");
      return;
    }
    try {
      const result = await createNodeMaster.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        attribute_schema: [TITLE_ATTRIBUTE],
      });
      toast.success("ノードマスタを作成しました");
      onOpenChange(false);
      onCreated?.(result.id);
    } catch (e: any) {
      toast.error(e.message || "作成に失敗しました");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新規ノードマスタ</DialogTitle>
          <DialogDescription>
            種類名と説明を入力してください。属性は作成後に「設定」から追加できます
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
              placeholder="例: 材料種別"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 材料の具体的な種類（SS400、SUS304 等）"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={createNodeMaster.isPending}>
            {createNodeMaster.isPending ? "作成中..." : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
