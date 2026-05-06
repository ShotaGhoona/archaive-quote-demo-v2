import { useState } from "react";
import { Pencil, Trash2, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  useCustomers,
  useDeleteCustomer,
  type Customer,
} from "@/hooks/useCustomers";
import { CustomerDialog } from "./CustomerDialog";

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  CUSTOMER: "顧客",
  SUPPLIER: "仕入先",
  BOTH: "両方",
};

export function CustomersSection() {
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id);
      toast.success("削除しました");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">取引先</h2>
              <p className="text-sm text-muted-foreground">取引先（顧客 / 仕入先）の管理</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            新規追加
          </Button>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>会社名</TableHead>
                  <TableHead>フリガナ</TableHead>
                  <TableHead>区分</TableHead>
                  <TableHead>ランク</TableHead>
                  <TableHead>連絡先</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!customers?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      取引先がありません。「新規追加」から登録してください。
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => {
                    const attrs = (c.attributes ?? {}) as Record<string, unknown>;
                    const phone = typeof attrs.phone === "string" ? attrs.phone : null;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.name_kana ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {CUSTOMER_TYPE_LABELS[c.customer_type] ?? c.customer_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.rank ? <Badge variant="outline">{c.rank}</Badge> : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {phone ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditTarget(c);
                              setDialogOpen(true);
                            }}
                            aria-label="編集"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(c)}
                            aria-label="削除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          target={editTarget}
        />

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>取引先を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                「{deleteTarget?.name ?? ""}」を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteCustomer.isPending}
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}
