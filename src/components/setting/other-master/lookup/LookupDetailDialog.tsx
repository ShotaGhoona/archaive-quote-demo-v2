import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, LayoutList, LayoutGrid } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  useActiveLookupVersion,
  type AxisDefinition,
  type LookupTable,
} from "@/hooks/useLookupTables";
import {
  useLookupRows,
  useDeleteLookupRow,
  type LookupRow,
} from "@/hooks/useLookupRows";
import { LookupRowDialog } from "./LookupRowDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lookupTable: LookupTable;
}

/** 行の指定軸の値を取得して表示用文字列にする */
function getAxisDisplayValue(row: LookupRow, axis: AxisDefinition): string {
  const cond = row.conditions as Record<string, unknown>;
  if (axis.match_type === "RANGE") {
    const min = cond[`${axis.variable_code}_min`];
    const max = cond[`${axis.variable_code}_max`];
    return `${min ?? "?"} 〜 ${max ?? "?"}`;
  }
  const v = cond[axis.variable_code];
  return v == null ? "-" : String(v);
}

/** 2D ビュー用: 行の軸の「同一性キー」 */
function getAxisKey(row: LookupRow, axis: AxisDefinition): string {
  const cond = row.conditions as Record<string, unknown>;
  if (axis.match_type === "RANGE") {
    return `${cond[`${axis.variable_code}_min`]}_${cond[`${axis.variable_code}_max`]}`;
  }
  return String(cond[axis.variable_code] ?? "");
}

export function LookupDetailDialog({ open, onOpenChange, lookupTable }: Props) {
  const axes = useMemo(() => {
    const arr = Array.isArray(lookupTable.axes)
      ? (lookupTable.axes as unknown as AxisDefinition[])
      : [];
    return arr.slice().sort((a, b) => (a.axis_order ?? 0) - (b.axis_order ?? 0));
  }, [lookupTable.axes]);

  const { data: version, isLoading: loadingVersion } = useActiveLookupVersion(
    open ? lookupTable.id : null
  );
  const versionId = version?.id ?? null;
  const { data: rows, isLoading: loadingRows } = useLookupRows(versionId);
  const deleteRow = useDeleteLookupRow();

  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LookupRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LookupRow | null>(null);

  // 2D ビュー用 state
  const [xAxisCode, setXAxisCode] = useState<string | null>(null);
  const [yAxisCode, setYAxisCode] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // axes が決まったら 2D の軸を初期化
  useEffect(() => {
    if (axes.length >= 2) {
      setXAxisCode(axes[0].variable_code);
      setYAxisCode(axes[1].variable_code);
    } else if (axes.length === 1) {
      setXAxisCode(axes[0].variable_code);
      setYAxisCode(null);
    }
    setFilterValues({});
  }, [axes]);

  const handleDelete = async () => {
    if (!deleteTarget || !versionId) return;
    try {
      await deleteRow.mutateAsync({ id: deleteTarget.id, version_id: versionId });
      toast.success("削除しました");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  const isLoading = loadingVersion || loadingRows;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lookupTable.name}</DialogTitle>
            <DialogDescription>
              {lookupTable.description ?? "ルックアップ詳細"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-3">
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setRowDialogOpen(true);
              }}
              disabled={!versionId || axes.length === 0}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              行を追加
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {axes.length} 軸 / {rows?.length ?? 0} 行
            </span>
          </div>

          {axes.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              軸が定義されていません。先に「編集」から軸を追加してください。
            </div>
          ) : isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <Tabs defaultValue="flat" className="space-y-3">
              <TabsList>
                <TabsTrigger value="flat" className="gap-2">
                  <LayoutList className="h-3.5 w-3.5" />
                  全行
                </TabsTrigger>
                <TabsTrigger value="grid" className="gap-2" disabled={axes.length < 2}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  2次元ビュー
                </TabsTrigger>
              </TabsList>

              {/* 全行ビュー */}
              <TabsContent value="flat">
                <FlatTable
                  rows={rows ?? []}
                  axes={axes}
                  onEdit={(r) => {
                    setEditTarget(r);
                    setRowDialogOpen(true);
                  }}
                  onDelete={(r) => setDeleteTarget(r)}
                />
              </TabsContent>

              {/* 2次元ビュー */}
              <TabsContent value="grid">
                <GridView
                  rows={rows ?? []}
                  axes={axes}
                  xAxisCode={xAxisCode}
                  yAxisCode={yAxisCode}
                  filterValues={filterValues}
                  onChangeX={setXAxisCode}
                  onChangeY={setYAxisCode}
                  onChangeFilter={setFilterValues}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {versionId && (
        <LookupRowDialog
          open={rowDialogOpen}
          onOpenChange={(o) => {
            setRowDialogOpen(o);
            if (!o) setEditTarget(null);
          }}
          versionId={versionId}
          axes={axes}
          target={editTarget}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>行を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この行を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteRow.isPending}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// 全行ビュー
// ────────────────────────────────────────────────────────────────────
function FlatTable({
  rows,
  axes,
  onEdit,
  onDelete,
}: {
  rows: LookupRow[];
  axes: AxisDefinition[];
  onEdit: (r: LookupRow) => void;
  onDelete: (r: LookupRow) => void;
}) {
  return (
    <div className="border border-border rounded-md max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            {axes.map((a) => (
              <TableHead key={a.variable_code}>
                <span className="font-mono text-xs">{a.variable_code}</span>
              </TableHead>
            ))}
            <TableHead>返り値</TableHead>
            <TableHead>補間</TableHead>
            <TableHead className="w-[100px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={axes.length + 3}
                className="text-center text-sm text-muted-foreground py-8"
              >
                行がありません。「行を追加」から登録してください。
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {axes.map((a) => (
                  <TableCell key={a.variable_code} className="font-mono text-xs">
                    {getAxisDisplayValue(row, a)}
                  </TableCell>
                ))}
                <TableCell className="font-mono">
                  {row.return_value}
                  {row.return_value_max != null && ` 〜 ${row.return_value_max}`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.interpolation ?? "CONSTANT"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(row)}
                    aria-label="編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(row)}
                    aria-label="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 2次元ビュー
// ────────────────────────────────────────────────────────────────────
function GridView({
  rows,
  axes,
  xAxisCode,
  yAxisCode,
  filterValues,
  onChangeX,
  onChangeY,
  onChangeFilter,
}: {
  rows: LookupRow[];
  axes: AxisDefinition[];
  xAxisCode: string | null;
  yAxisCode: string | null;
  filterValues: Record<string, string>;
  onChangeX: (v: string) => void;
  onChangeY: (v: string) => void;
  onChangeFilter: (next: Record<string, string>) => void;
}) {
  const xAxis = axes.find((a) => a.variable_code === xAxisCode) ?? null;
  const yAxis = axes.find((a) => a.variable_code === yAxisCode) ?? null;
  const otherAxes = axes.filter(
    (a) => a.variable_code !== xAxisCode && a.variable_code !== yAxisCode
  );

  // 各軸の取りうる値（distinct）
  const distinctValuesByAxis = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of axes) {
      const seen = new Set<string>();
      const arr: string[] = [];
      for (const r of rows) {
        const k = getAxisKey(r, a);
        if (!seen.has(k)) {
          seen.add(k);
          arr.push(k);
        }
      }
      map.set(a.variable_code, arr);
    }
    return map;
  }, [rows, axes]);

  // 残り軸でフィルタが未設定のものは「すべて」として全行扱う、
  // フィルタが設定されたら一致行のみ
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      for (const a of otherAxes) {
        const sel = filterValues[a.variable_code];
        if (sel == null || sel === "") continue; // 未設定は通す
        if (getAxisKey(r, a) !== sel) return false;
      }
      return true;
    });
  }, [rows, otherAxes, filterValues]);

  const xValues = xAxis ? distinctValuesByAxis.get(xAxis.variable_code) ?? [] : [];
  const yValues = yAxis ? distinctValuesByAxis.get(yAxis.variable_code) ?? [] : [];

  // セルの値: x キー × y キー で合致する行（フィルタ後）
  const cellValue = (xKey: string, yKey: string): LookupRow | null => {
    return (
      filteredRows.find((r) => {
        const xMatch = xAxis ? getAxisKey(r, xAxis) === xKey : true;
        const yMatch = yAxis ? getAxisKey(r, yAxis) === yKey : true;
        return xMatch && yMatch;
      }) ?? null
    );
  };

  const labelForKey = (axis: AxisDefinition, key: string): string => {
    if (axis.match_type === "RANGE") {
      const [min, max] = key.split("_");
      return `${min} 〜 ${max}`;
    }
    return key;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 rounded-md border p-3 bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">列軸 (X)</Label>
          <Select value={xAxisCode ?? ""} onValueChange={onChangeX}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {axes.map((a) => (
                <SelectItem
                  key={a.variable_code}
                  value={a.variable_code}
                  disabled={a.variable_code === yAxisCode}
                >
                  {a.variable_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">行軸 (Y)</Label>
          <Select value={yAxisCode ?? ""} onValueChange={onChangeY}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {axes.map((a) => (
                <SelectItem
                  key={a.variable_code}
                  value={a.variable_code}
                  disabled={a.variable_code === xAxisCode}
                >
                  {a.variable_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {otherAxes.length > 0 && (
        <div className="rounded-md border p-3 bg-muted/30 space-y-2">
          <Label className="text-xs">残り軸の絞り込み（未設定なら全件）</Label>
          <div className="grid grid-cols-2 gap-3">
            {otherAxes.map((a) => {
              const values = distinctValuesByAxis.get(a.variable_code) ?? [];
              const selValue = filterValues[a.variable_code] ?? "__all__";
              return (
                <div key={a.variable_code} className="space-y-1">
                  <Label className="text-xs font-mono">{a.variable_code}</Label>
                  <Select
                    value={selValue}
                    onValueChange={(v) =>
                      onChangeFilter({
                        ...filterValues,
                        [a.variable_code]: v === "__all__" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">（すべて）</SelectItem>
                      {values.map((k) => (
                        <SelectItem key={k} value={k}>
                          {labelForKey(a, k)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border border-border rounded-md max-h-[55vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="font-mono text-xs">
                {yAxis?.variable_code ?? ""} / {xAxis?.variable_code ?? ""}
              </TableHead>
              {xValues.map((xKey) => (
                <TableHead key={xKey} className="font-mono text-xs whitespace-nowrap">
                  {xAxis ? labelForKey(xAxis, xKey) : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {yValues.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={xValues.length + 1}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  該当する行がありません
                </TableCell>
              </TableRow>
            ) : (
              yValues.map((yKey) => (
                <TableRow key={yKey}>
                  <TableHead className="font-mono text-xs whitespace-nowrap">
                    {yAxis ? labelForKey(yAxis, yKey) : ""}
                  </TableHead>
                  {xValues.map((xKey) => {
                    const r = cellValue(xKey, yKey);
                    return (
                      <TableCell
                        key={xKey}
                        className="font-mono text-sm text-center"
                      >
                        {r ? (
                          <span>
                            {r.return_value}
                            {r.return_value_max != null && (
                              <>
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  〜 {r.return_value_max}
                                </span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
