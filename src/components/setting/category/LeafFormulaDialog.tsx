import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import type { SelectionTreeNode } from "@/hooks/useSelectionTreeNodes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** どのノードを葉にするか（path の末端） */
  parentNode: SelectionTreeNode | null;
}

export function LeafFormulaDialog({ open, onOpenChange, parentNode }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {parentNode ? `${parentNode.label} を葉にする` : "葉にする"}
          </DialogTitle>
          <DialogDescription>
            この経路を計算式で確定します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground space-y-2">
            <Calculator className="h-6 w-6 mx-auto text-muted-foreground/60" />
            <div>新規計算式 または 既存の計算式をリンク</div>
            <div className="text-xs italic">（今後実装予定）</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
