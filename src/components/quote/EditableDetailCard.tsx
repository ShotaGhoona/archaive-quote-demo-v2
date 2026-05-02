import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Pencil, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  useSelectionTreeNodes,
  type QuoteCategory,
  type SelectionTreeNode,
} from "@/hooks/useSelectionTreeNodes";
import { useFormulaTemplate } from "@/hooks/useFormulaTemplates";
import { useVariableDefinitions } from "@/hooks/useVariableDefinitions";
import {
  useDeleteQuoteDetail,
  useUpdateQuoteDetail,
  type QuoteDetail,
} from "@/hooks/useQuotes";
import {
  applyOverrides,
  evaluateFormula,
  resolveAllVariables,
  type ResolvedVariable,
} from "@/lib/quoteCalc";
import { useLookupContext } from "@/lib/useLookupContext";
import { PathSelector } from "./PathSelector";
import { VariableInputArea } from "./VariableInputArea";
import { DetailEditDialog } from "./DetailEditDialog";

interface Props {
  index: number;
  category: QuoteCategory;
  detail: QuoteDetail;
}

export function EditableDetailCard({ index, category, detail }: Props) {
  const { data: nodes } = useSelectionTreeNodes(category);
  const { data: variableDefs } = useVariableDefinitions();
  const lookupContext = useLookupContext();
  const updateDetail = useUpdateQuoteDetail();
  const deleteDetail = useDeleteQuoteDetail();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ローカル編集状態
  const [pathIds, setPathIds] = useState<string[]>(
    (detail.selection_path ?? []) as string[]
  );
  const [leaf, setLeaf] = useState<SelectionTreeNode | null>(null);
  const [pathNodes, setPathNodes] = useState<SelectionTreeNode[]>([]);
  const [manualValues, setManualValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    const saved = (detail.variable_values ?? {}) as Record<string, unknown>;
    for (const k of Object.keys(saved)) {
      const v = saved[k];
      if (typeof v === "number" || typeof v === "string") out[k] = String(v);
    }
    return out;
  });

  const { data: formulaTemplate } = useFormulaTemplate(
    leaf?.formula_template_id ?? detail.formula_template_id ?? null
  );

  // 計算式が要求する変数コード
  const requiredCodes = useMemo<string[]>(() => {
    if (!formulaTemplate) return [];
    const arr = Array.isArray(formulaTemplate.variables)
      ? (formulaTemplate.variables as unknown[])
      : [];
    return arr
      .map((v) =>
        typeof v === "object" && v && "code" in v
          ? (v as { code: unknown }).code
          : null
      )
      .filter((c): c is string => typeof c === "string");
  }, [formulaTemplate]);

  // 変数解決
  const resolved: ResolvedVariable[] = useMemo(() => {
    if (!formulaTemplate || !variableDefs) return [];
    const manualNum: Record<string, number | string> = {};
    for (const k of Object.keys(manualValues)) {
      const v = manualValues[k];
      if (v === "") continue;
      const n = Number(v);
      manualNum[k] = Number.isNaN(n) ? v : n;
    }
    return resolveAllVariables(
      requiredCodes,
      variableDefs,
      manualNum,
      pathNodes,
      lookupContext
    );
  }, [formulaTemplate, variableDefs, requiredCodes, manualValues, pathNodes, lookupContext]);

  const computedValue = useMemo(() => {
    if (!formulaTemplate) return null;
    const scope: Record<string, number | string | null> = {};
    for (const v of resolved) scope[v.code] = v.value;
    return evaluateFormula(formulaTemplate.formula, scope);
  }, [formulaTemplate, resolved]);

  // 上書き適用後の採用値
  const finalValue = useMemo(
    () =>
      applyOverrides(
        computedValue,
        detail.multiplier ?? 1,
        detail.adjustment ?? 0,
        detail.override_value
      ),
    [computedValue, detail.multiplier, detail.adjustment, detail.override_value]
  );

  const hasOverrides =
    (detail.multiplier ?? 1) !== 1 ||
    (detail.adjustment ?? 0) !== 0 ||
    detail.override_value != null;

  // ────────── auto-save (debounced) ──────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<{
    pathIds: string[];
    leafId: string | null;
    formulaId: string | null;
    variableValues: Record<string, unknown>;
    computed: number | null;
  }>({
    pathIds: (detail.selection_path ?? []) as string[],
    leafId: detail.leaf_node_id,
    formulaId: detail.formula_template_id,
    variableValues: (detail.variable_values ?? {}) as Record<string, unknown>,
    computed: detail.computed_value,
  });

  useEffect(() => {
    // 同期: 表示中の値が前回保存と同じならスキップ
    const variableValues: Record<string, unknown> = {};
    for (const v of resolved) variableValues[v.code] = v.value;

    const sameVars =
      JSON.stringify(variableValues) ===
      JSON.stringify(lastSaved.current.variableValues);
    const samePath =
      JSON.stringify(pathIds) === JSON.stringify(lastSaved.current.pathIds);
    const sameLeaf = (leaf?.id ?? null) === lastSaved.current.leafId;
    const sameFormula =
      (formulaTemplate?.id ?? null) === lastSaved.current.formulaId;
    const sameComputed = computedValue === lastSaved.current.computed;
    if (sameVars && samePath && sameLeaf && sameFormula && sameComputed) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await updateDetail.mutateAsync({
          id: detail.id,
          quote_lot_id: detail.quote_lot_id,
          selection_path: pathIds,
          leaf_node_id: leaf?.id ?? null,
          formula_template_id: formulaTemplate?.id ?? null,
          variable_values: variableValues,
          computed_value: computedValue,
          final_value: finalValue,
        });
        lastSaved.current = {
          pathIds: [...pathIds],
          leafId: leaf?.id ?? null,
          formulaId: formulaTemplate?.id ?? null,
          variableValues,
          computed: computedValue,
        };
      } catch (e: any) {
        toast.error(e.message || "自動保存に失敗しました");
      }
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathIds, leaf?.id, formulaTemplate?.id, manualValues, computedValue]);

  const handleDelete = async () => {
    try {
      await deleteDetail.mutateAsync({
        id: detail.id,
        quote_lot_id: detail.quote_lot_id,
      });
      toast.success("削除しました");
    } catch (e: any) {
      toast.error(e.message || "削除に失敗しました");
    }
  };

  // パス変更時 → 葉でなくなったら formula を消す（変数もクリア）
  const handleSelectionChange = (
    nextLeaf: SelectionTreeNode | null,
    nextPath: SelectionTreeNode[]
  ) => {
    setPathNodes(nextPath);
    setPathIds(nextPath.map((n) => n.id));
    if (nextLeaf?.id !== leaf?.id) {
      setManualValues({});
    }
    setLeaf(nextLeaf);
  };

  void nodes; // eslint suppress

  return (
    <div className="space-y-2">
      {/* ヘッダー: 番号 + パス pulldown 群 + 削除 */}
      <div className="flex items-start gap-2">
        <span className="text-sm text-muted-foreground tabular-nums w-5 shrink-0 pt-2">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <PathSelector
            category={category}
            initialPath={(detail.selection_path ?? []) as string[]}
            onSelectionChange={handleSelectionChange}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteDetail.isPending}
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>削除</TooltipContent>
        </Tooltip>
      </div>

      <DetailEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        detail={detail}
      />

      {/* カード: 葉に到達したら表示 */}
      {leaf && formulaTemplate && (
        <Card className="ml-7 p-4">
          <div className="flex gap-5 items-stretch">
            {/* 左: 変数入力 */}
            <div className="flex-1 min-w-0">
              {resolved.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  この計算式は変数を要求しません
                </div>
              ) : (
                <VariableInputArea
                  variables={resolved}
                  onChange={(code, value) =>
                    setManualValues((prev) => ({ ...prev, [code]: value }))
                  }
                />
              )}
            </div>

            {/* 右: 計算式 + 小計 */}
            <div className="shrink-0 pl-5 border-l border-border min-w-[220px] flex flex-col">
              {/* 計算式 */}
              <div className="space-y-2">
                <Badge variant="secondary" className="font-normal gap-1.5">
                  <Calculator className="h-3 w-3" />
                  {formulaTemplate.name}
                </Badge>
                <code className="block text-[11px] font-mono text-muted-foreground bg-muted/50 border border-border/60 rounded px-2 py-1.5 break-all leading-relaxed">
                  {formulaTemplate.formula}
                </code>
              </div>

              <Separator className="my-3" />

              {/* 小計（1行） */}
              <div className="flex-1 flex items-end">
                <div className="flex items-baseline justify-between gap-2 w-full">
                  <span className="text-sm text-muted-foreground">
                    小計
                    {hasOverrides && (
                      <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        上書き
                      </span>
                    )}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <div className="font-mono">
                      {finalValue == null ? (
                        <span className="text-2xl font-bold text-muted-foreground/40">
                          —
                        </span>
                      ) : (
                        <>
                          <span className="text-sm font-normal text-muted-foreground mr-0.5">
                            ¥
                          </span>
                          <span className="text-2xl font-bold tabular-nums">
                            {Math.round(finalValue).toLocaleString("ja-JP")}
                          </span>
                        </>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 self-center text-muted-foreground"
                          aria-label="編集"
                          onClick={() => setEditDialogOpen(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>上書き編集</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
