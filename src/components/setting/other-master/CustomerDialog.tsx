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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCreateCustomer,
  useUpdateCustomer,
  CUSTOMER_TYPES,
  CUSTOMER_RANKS,
  type Customer,
} from "@/hooks/useCustomers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: Customer | null;
}

const RANK_NONE = "__none__";

export function CustomerDialog({ open, onOpenChange, target }: Props) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEdit = !!target;

  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [customerType, setCustomerType] = useState<string>("CUSTOMER");
  const [rank, setRank] = useState<string>(RANK_NONE);
  const [phone, setPhone] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(target?.name ?? "");
    setNameKana(target?.name_kana ?? "");
    setCustomerType(target?.customer_type ?? "CUSTOMER");
    setRank(target?.rank ?? RANK_NONE);
    const attrs = (target?.attributes ?? {}) as Record<string, unknown>;
    setPhone(typeof attrs.phone === "string" ? attrs.phone : "");
    setRemarks(target?.remarks ?? "");
  }, [open, target]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("会社名は必須です");
      return;
    }
    const payload = {
      name: name.trim(),
      name_kana: nameKana.trim() || null,
      customer_type: customerType,
      rank: rank === RANK_NONE ? null : rank,
      remarks: remarks.trim() || null,
      attributes: phone.trim() ? { phone: phone.trim() } : {},
    };
    try {
      if (isEdit && target) {
        await updateCustomer.mutateAsync({ id: target.id, ...payload });
        toast.success("更新しました");
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success("追加しました");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "取引先の編集" : "取引先の追加"}</DialogTitle>
          <DialogDescription>顧客 / 仕入先 / 両方の情報を管理します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              会社名<span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ◯◯製作所"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_kana">フリガナ</Label>
            <Input
              id="name_kana"
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
              placeholder="例: マルマルセイサクショ"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>区分</Label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "CUSTOMER" ? "顧客" : t === "SUPPLIER" ? "仕入先" : "両方"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ランク</Label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RANK_NONE}>なし</SelectItem>
                  {CUSTOMER_RANKS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 03-1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">備考</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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
