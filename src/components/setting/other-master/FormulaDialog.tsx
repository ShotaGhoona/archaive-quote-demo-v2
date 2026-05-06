import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Delete, RotateCcw } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useVariableDefinitions } from "@/hooks/useVariableDefinitions";
import {
  useCreateFormulaTemplate,
  useUpdateFormulaTemplate,
  type FormulaTemplate,
} from "@/hooks/useFormulaTemplates";
import {
  QUOTE_CATEGORIES,
  type QuoteCategory,
} from "@/hooks/useSelectionTreeNodes";
import { VariableDialog } from "./VariableDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 編集対象（null = 新規作成） */
  target: FormulaTemplate | null;
  /** 新規作成時のデフォルトカテゴリ（未指定なら なし） */
  defaultCategory?: QuoteCategory | null;
  onSaved?: (id: string) => void;
}

const CATEGORY_NONE = "__none__";

const SOURCE_LABELS: Record<string, string> = {
  PATH: "パス（経路から取得）",
  LOOKUP: "LOOKUP参照",
  MANUAL: "手入力",
};

// 数字（電卓配列）。表示順を 4×4 グリッドで「7 8 9 ÷ / 4 5 6 × / 1 2 3 - / 0 . ^ +」とする
type PadKey = { label: string; insert: string; tone?: "operator" | "number" };

const CALC_KEYS: PadKey[] = [
  { label: "7", insert: "7", tone: "number" },
  { label: "8", insert: "8", tone: "number" },
  { label: "9", insert: "9", tone: "number" },
  { label: "÷", insert: " / ", tone: "operator" },
  { label: "4", insert: "4", tone: "number" },
  { label: "5", insert: "5", tone: "number" },
  { label: "6", insert: "6", tone: "number" },
  { label: "×", insert: " * ", tone: "operator" },
  { label: "1", insert: "1", tone: "number" },
  { label: "2", insert: "2", tone: "number" },
  { label: "3", insert: "3", tone: "number" },
  { label: "-", insert: " - ", tone: "operator" },
  { label: "0", insert: "0", tone: "number" },
  { label: ".", insert: ".", tone: "number" },
  { label: "^", insert: "^", tone: "operator" },
  { label: "+", insert: " + ", tone: "operator" },
];

// 補助（カッコ・整数除算・pow）
const HELPER_KEYS: PadKey[] = [
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
  { label: "//", insert: " \\ " },
  { label: "pow", insert: "pow(" },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 計算式の preview 文字列を生成（変数コード→ラベル、*→×、/→÷） */
function makeReadable(
  formula: string,
  vars: { code: string; label: string }[]
): string {
  if (!formula) return "";
  let result = formula;
  // 長い code から先に置換
  const sorted = [...vars]
    .filter((v) => v.label && v.code !== v.label)
    .sort((a, b) => b.code.length - a.code.length);
  for (const v of sorted) {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(v.code)) {
      const re = new RegExp(`\\b${escapeRegex(v.code)}\\b`, "g");
      result = result.replace(re, v.label);
    } else {
      result = result.split(v.code).join(v.label);
    }
  }
  result = result.replace(/\s*\*\s*/g, " × ");
  result = result.replace(/\s*\/\s*/g, " ÷ ");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

// 関数（極値・丸めを統合）
const FUNCTION_KEYS: PadKey[] = [
  { label: "最小", insert: "min(" },
  { label: "最大", insert: "max(" },
  { label: "切り上げ", insert: "ceil(" },
  { label: "切り捨て", insert: "floor(" },
  { label: "四捨五入", insert: "round(" },
];

// 条件（比較・論理を統合）
const CONDITION_KEYS: PadKey[] = [
  { label: "==", insert: " == " },
  { label: ">", insert: " > " },
  { label: ">=", insert: " >= " },
  { label: "<", insert: " < " },
  { label: "<=", insert: " <= " },
  { label: "and", insert: " and " },
  { label: "or", insert: " or " },
  { label: "if", insert: " ? : " },
];

// ヒント: 関数のリファレンス
const FUNCTION_REFERENCE: { code: string; label: string; example: string }[] = [
  { code: "ceil", label: "切り上げ", example: "ceil(1.2) = 2" },
  { code: "floor", label: "切り捨て", example: "floor(1.8) = 1" },
  { code: "round", label: "四捨五入", example: "round(1.5) = 2" },
  { code: "min", label: "最小", example: "min(3, 5) = 3" },
  { code: "max", label: "最大", example: "max(3, 5) = 5" },
];

export function FormulaDialog({
  open,
  onOpenChange,
  target,
  defaultCategory,
  onSaved,
}: Props) {
  const isEdit = !!target;
  const { data: variables, isLoading: loadingVars } = useVariableDefinitions();
  const createTemplate = useCreateFormulaTemplate();
  const updateTemplate = useUpdateFormulaTemplate();
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORY_NONE);
  const [selectedVarCodes, setSelectedVarCodes] = useState<Set<string>>(new Set());

  const formulaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * テキストを末尾に追加 or キャレット位置に挿入。
   * - textarea にフォーカスがあるとき: その位置に挿入
   * - そうでないとき: 末尾に追加（ボタンタブはこちら）
   */
  const insertOrAppend = (text: string) => {
    const ta = formulaRef.current;
    if (ta && document.activeElement === ta) {
      const start = ta.selectionStart ?? formula.length;
      const end = ta.selectionEnd ?? formula.length;
      const next = formula.slice(0, start) + text + formula.slice(end);
      setFormula(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + text.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      setFormula((prev) => prev + text);
    }
  };

  const backspaceFormula = () =>
    setFormula((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
  const clearFormula = () => setFormula("");

  useEffect(() => {
    if (!open) return;
    setName(target?.name ?? "");
    setFormula(target?.formula ?? "");
    setDescription(target?.description ?? "");
    setCategory(
      target?.category ?? defaultCategory ?? CATEGORY_NONE
    );
    const arr = Array.isArray(target?.variables) ? (target!.variables as unknown[]) : [];
    const codes = arr
      .map((v) =>
        typeof v === "object" && v && "code" in v
          ? (v as { code: unknown }).code
          : null
      )
      .filter((c): c is string => typeof c === "string");
    setSelectedVarCodes(new Set(codes));
  }, [open, target, defaultCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof variables>();
    for (const src of ["PATH", "LOOKUP", "MANUAL"]) {
      map.set(src, []);
    }
    for (const v of variables ?? []) {
      const src = v.source ?? "MANUAL";
      const arr = map.get(src) ?? [];
      arr.push(v);
      map.set(src, arr);
    }
    return map;
  }, [variables]);

  const toggleVar = (code: string) => {
    setSelectedVarCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !formula.trim()) {
      toast.error("名前と計算式は必須です");
      return;
    }
    const variablesJson = Array.from(selectedVarCodes).map((code) => ({ code }));
    const cat = category === CATEGORY_NONE ? null : (category as QuoteCategory);

    try {
      if (isEdit && target) {
        await updateTemplate.mutateAsync({
          id: target.id,
          name: name.trim(),
          formula: formula.trim(),
          description: description.trim() || null,
          category: cat,
          variables: variablesJson,
        });
        toast.success("更新しました");
        onSaved?.(target.id);
      } else {
        const result = await createTemplate.mutateAsync({
          name: name.trim(),
          formula: formula.trim(),
          description: description.trim() || null,
          category: cat,
          variables: variablesJson,
        });
        toast.success("計算式を作成しました");
        onSaved?.(result.id);
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "保存に失敗しました");
    }
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;
  const selectedList = (variables ?? []).filter((v) =>
    selectedVarCodes.has(v.code)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] gap-0 grid-rows-[auto_minmax(0,1fr)_auto]">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "計算式の編集" : "新規計算式"}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-hidden -mx-6 px-6 py-4 grid grid-cols-2 gap-6 min-h-0">
            {/* 左カラム: メタ情報 + 使う変数 */}
            <div className="flex flex-col gap-4 min-h-0">
              <div className="grid grid-cols-[1fr_auto] gap-3 shrink-0">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    名前<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: SS400 重量計算"
                  />
                </div>
                <div className="space-y-2">
                  <Label>カテゴリ</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CATEGORY_NONE}>（共通）</SelectItem>
                      {QUOTE_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 shrink-0">
                <Label htmlFor="description">説明</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例: SS400 の丸棒材料費"
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <Label>使う変数</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVariableDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    新しい変数
                  </Button>
                </div>

                {loadingVars ? (
                  <Skeleton className="h-72 shrink-0" />
                ) : (
                  <div className="border border-border rounded-md divide-y flex-1 min-h-0 overflow-y-auto">
                    {Array.from(grouped.entries()).map(([src, vars]) => (
                      <div key={src} className="p-2">
                        <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                          {SOURCE_LABELS[src] ?? src}
                        </div>
                        {!vars || vars.length === 0 ? (
                          <div className="px-2 py-1 text-xs text-muted-foreground italic">
                            （なし）
                          </div>
                        ) : (
                          vars.map((v) => (
                            <label
                              key={v.id}
                              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded-sm"
                            >
                              <Checkbox
                                checked={selectedVarCodes.has(v.code)}
                                onCheckedChange={() => toggleVar(v.code)}
                              />
                              <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                {v.code}
                              </code>
                              <span className="text-sm">{v.label}</span>
                              {v.description && (
                                <span className="text-xs text-muted-foreground truncate ml-auto">
                                  {v.description}
                                </span>
                              )}
                            </label>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右カラム: 計算式の構築 */}
            <div className="flex flex-col gap-3 min-h-0">
              <Label className="shrink-0">
                計算式<span className="text-destructive ml-1">*</span>
              </Label>

              <Tabs
                defaultValue="buttons"
                className="flex-1 min-h-0 flex flex-col gap-3"
              >
                <TabsList className="w-full shrink-0">
                  <TabsTrigger value="buttons" className="flex-1">
                    ボタン入力
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex-1">
                    直接入力
                  </TabsTrigger>
                </TabsList>

                {/* ボタン入力タブ */}
                <TabsContent
                  value="buttons"
                  className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-3"
                >
                  {/* プレビュー（日本語ラベル化された式） */}
                  <div className="rounded-md border border-border bg-card p-3 min-h-[88px] flex items-start justify-between gap-2 shadow-sm shrink-0">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        プレビュー
                      </div>
                      <div className="text-sm break-all leading-relaxed">
                        {formula ? (
                          makeReadable(formula, variables ?? [])
                        ) : (
                          <span className="text-muted-foreground italic">
                            下のボタンで式を組み立ててください
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={backspaceFormula}
                        disabled={!formula}
                        className="h-7 w-7 flex items-center justify-center rounded border bg-card hover:bg-accent disabled:opacity-40"
                        title="1文字削除"
                      >
                        <Delete className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={clearFormula}
                        disabled={!formula}
                        className="h-7 w-7 flex items-center justify-center rounded border bg-card hover:bg-accent disabled:opacity-40"
                        title="全消去"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 電卓パッド + 補助 + 関数 */}
                  <div className="rounded-md border border-border/60 bg-muted/20 p-3 flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
                    {/* 変数 */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-muted-foreground">
                        変数
                      </div>
                      {selectedList.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic px-1 py-1">
                          左で変数を選択してください
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
                          {selectedList.map((v) => (
                            <CalcButton
                              key={v.id}
                              tone="helper"
                              onClick={() => insertOrAppend(v.code)}
                            >
                              <span className="text-xs leading-none">
                                {v.label}
                              </span>
                            </CalcButton>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* 電卓グリッド (4×4) — 余った高さを吸収 */}
                    <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-[160px]">
                      {CALC_KEYS.map((k) => (
                        <CalcButton
                          key={k.label}
                          tone={k.tone}
                          onClick={() => insertOrAppend(k.insert)}
                          className="h-full"
                        >
                          {k.label}
                        </CalcButton>
                      ))}
                    </div>

                    {/* 補助 (( ) // pow) */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {HELPER_KEYS.map((k) => (
                        <CalcButton
                          key={k.label}
                          tone="helper"
                          onClick={() => insertOrAppend(k.insert)}
                        >
                          {k.label}
                        </CalcButton>
                      ))}
                    </div>

                    <Separator />

                    {/* 関数（極値・丸め統合）: 5列グリッド */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-muted-foreground">
                        関数
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {FUNCTION_KEYS.map((k) => (
                          <CalcButton
                            key={k.label}
                            tone="helper"
                            onClick={() => insertOrAppend(k.insert)}
                          >
                            <span className="text-[11px] leading-none">
                              {k.label}
                            </span>
                          </CalcButton>
                        ))}
                      </div>
                    </div>

                    {/* 条件（比較・論理統合）: 4列×2行グリッド */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-muted-foreground">
                        条件
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {CONDITION_KEYS.map((k) => (
                          <CalcButton
                            key={k.label}
                            tone="helper"
                            onClick={() => insertOrAppend(k.insert)}
                          >
                            {k.label}
                          </CalcButton>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 直接入力タブ */}
                <TabsContent
                  value="text"
                  className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col gap-3"
                >
                  <Textarea
                    id="formula"
                    ref={formulaRef}
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="例: (d/2)^2 * PI * L * rho/1000000 * P * Y"
                    className="font-mono text-sm flex-1 min-h-0 resize-none"
                  />

                  {/* ヒント */}
                  <div className="rounded-md border border-border/60 bg-card p-3 shrink-0 max-h-[45%] overflow-y-auto space-y-4">
                    {/* 変数 */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold">変数</div>
                      {loadingVars ? (
                        <Skeleton className="h-20" />
                      ) : !variables || variables.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">
                          登録された変数がありません
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                          {variables.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs shrink-0 min-w-[3.5rem] text-center">
                                {v.code}
                              </code>
                              <span className="truncate">{v.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* 関数 */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold">関数</div>
                      <div className="space-y-1">
                        {FUNCTION_REFERENCE.map((f) => (
                          <div
                            key={f.code}
                            className="flex items-center gap-2 text-sm"
                          >
                            <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs shrink-0 min-w-[3.5rem] text-center">
                              {f.code}
                            </code>
                            <span className="text-muted-foreground">
                              {f.label}
                            </span>
                            <code className="font-mono text-[11px] text-muted-foreground/80 ml-auto">
                              {f.example}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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

      <VariableDialog
        open={variableDialogOpen}
        onOpenChange={setVariableDialogOpen}
        target={null}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// 電卓キー（数字/演算子）— 大きめ正方形、tone でカラーバリエーション
// ────────────────────────────────────────────────────────────────────
function CalcButton({
  children,
  tone = "number",
  onClick,
  className,
}: {
  children: React.ReactNode;
  tone?: "number" | "operator" | "helper";
  onClick: () => void;
  className?: string;
}) {
  const toneClass =
    tone === "operator"
      ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 font-semibold"
      : tone === "helper"
      ? "bg-muted text-foreground hover:bg-muted/70 border-border"
      : "bg-card text-foreground hover:bg-accent border-border";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 inline-flex items-center justify-center rounded-md border text-base font-mono shadow-sm active:translate-y-[1px] transition-all",
        toneClass,
        className
      )}
    >
      {children}
    </button>
  );
}
