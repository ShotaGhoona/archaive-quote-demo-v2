import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
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

// 計算式構築用ボタン（mathjs 構文に従う）
const BUTTON_SECTIONS: { label: string; buttons: { label: string; insert: string }[] }[] = [
  {
    label: "算術",
    buttons: [
      { label: "+", insert: " + " },
      { label: "-", insert: " - " },
      { label: "×", insert: " * " },
      { label: "÷", insert: " / " },
      { label: "//", insert: " \\ " }, // 整数除算 (mathjs)
      { label: "pow", insert: "pow(" },
    ],
  },
  {
    label: "極値",
    buttons: [
      { label: "最小", insert: "min(" },
      { label: "最大", insert: "max(" },
    ],
  },
  {
    label: "比較",
    buttons: [
      { label: "==", insert: " == " },
      { label: ">", insert: " > " },
      { label: ">=", insert: " >= " },
      { label: "<", insert: " < " },
      { label: "<=", insert: " <= " },
    ],
  },
  {
    label: "条件",
    buttons: [
      { label: "and", insert: " and " },
      { label: "or", insert: " or " },
      { label: "if", insert: " ? : " }, // 三項演算子
    ],
  },
  {
    label: "丸め",
    buttons: [
      { label: "切り上げ", insert: "ceil(" },
      { label: "切り捨て", insert: "floor(" },
      { label: "四捨五入", insert: "round(" },
    ],
  },
  {
    label: "補助",
    buttons: [
      { label: "(", insert: "(" },
      { label: ")", insert: ")" },
    ],
  },
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

  // textarea のキャレット位置に文字列を挿入
  const insertAtCursor = (text: string) => {
    const ta = formulaRef.current;
    const start = ta?.selectionStart ?? formula.length;
    const end = ta?.selectionEnd ?? formula.length;
    const next = formula.slice(0, start) + text + formula.slice(end);
    setFormula(next);
    // フォーカス + キャレット復帰
    requestAnimationFrame(() => {
      const ta2 = formulaRef.current;
      if (!ta2) return;
      ta2.focus();
      const pos = start + text.length;
      ta2.setSelectionRange(pos, pos);
    });
  };

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "計算式の編集" : "新規計算式"}
            </DialogTitle>
            <DialogDescription>
              使う変数を選び、それらを使った計算式を組み立てます
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* 左カラム: メタ情報 + 使う変数 */}
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-3">
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

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例: SS400 の丸棒材料費"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
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
                  <Skeleton className="h-72" />
                ) : (
                  <div className="border border-border rounded-md max-h-[420px] overflow-y-auto divide-y">
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
            <div className="space-y-3">
              <Label htmlFor="formula">
                計算式<span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="formula"
                ref={formulaRef}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="例: (d/2)^2 * PI * L * rho/1000000 * P * Y"
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                ボタン or 直接入力で構築してください
              </p>

              <div className="rounded-md border border-border/60 bg-muted/20 p-3 max-h-[420px] overflow-y-auto divide-y divide-border/40">
                {/* 変数（選択中のみ） */}
                <ButtonSection label="変数">
                  {selectedList.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      左で変数を選択してください
                    </span>
                  ) : (
                    selectedList.map((v) => (
                      <PadButton
                        key={v.id}
                        title={v.label}
                        onClick={() => insertAtCursor(v.code)}
                      >
                        {v.code}
                      </PadButton>
                    ))
                  )}
                </ButtonSection>

                {/* 算術 / 極値 / 比較 / 条件 / 丸め / 補助 */}
                {BUTTON_SECTIONS.map((sec) => (
                  <ButtonSection key={sec.label} label={sec.label}>
                    {sec.buttons.map((b) => (
                      <PadButton
                        key={b.label}
                        onClick={() => insertAtCursor(b.insert)}
                      >
                        {b.label}
                      </PadButton>
                    ))}
                  </ButtonSection>
                ))}
              </div>
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
// 1セクション分のボタン群（label を左、ボタンを右に横並び）
// ────────────────────────────────────────────────────────────────────
function ButtonSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5 first:pt-0 last:pb-0">
      <div className="w-10 shrink-0 pt-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
      <div className="flex-1 flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// キーボード風の小ボタン
// ────────────────────────────────────────────────────────────────────
function PadButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="h-7 min-w-[2rem] px-2 inline-flex items-center justify-center rounded-md border border-border bg-card text-xs font-mono shadow-sm hover:bg-accent hover:border-primary/40 active:translate-y-[1px] transition-all"
    >
      {children}
    </button>
  );
}
