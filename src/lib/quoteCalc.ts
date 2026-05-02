/**
 * 計算エンジン
 *
 * - formula 評価: mathjs (functions, operators, variable substitution)
 * - PATH 変数解決: パス上のノードマスタ値の values JSONB から取得
 * - LOOKUP 変数解決: lookup_rows を条件マッチで引く（CONSTANT / LINEAR）
 * - 丸め: FLOOR / CEIL / ROUND × 桁数
 */
import { create, all } from "mathjs";
import type { VariableDefinition } from "@/hooks/useVariableDefinitions";
import type { SelectionTreeNode } from "@/hooks/useSelectionTreeNodes";
import type { LookupRow } from "@/hooks/useLookupRows";
import type { AxisDefinition } from "@/hooks/useLookupTables";

const math = create(all, {});

// ────────────────────────────────────────────────────────────────────
// 変数解決
// ────────────────────────────────────────────────────────────────────

/**
 * PATH 変数を経路上のノードマスタ値から解決
 *
 * @param pathNodes ルート→葉までのノード配列
 * @param pathKey 取得するキー（例: 'density', 'unit_price', 'hourly_rate'）
 * @returns 値 or null（経路上にキーが無ければ null）
 */
export function resolvePathVariable(
  pathNodes: SelectionTreeNode[],
  pathKey: string
): number | string | null {
  for (const node of pathNodes) {
    const v = node.node_master_value?.values as
      | Record<string, unknown>
      | null
      | undefined;
    if (v && pathKey in v) {
      const raw = v[pathKey];
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        const n = Number(raw);
        return Number.isNaN(n) ? raw : n;
      }
    }
  }
  return null;
}

/**
 * LOOKUP 行を条件マッチで引く（最初に一致した行）
 *
 * @param rows LOOKUP の全行
 * @param axes 軸定義
 * @param queryValues 軸ごとのクエリ値（variable_code → 値）
 * @returns 一致行 or null
 */
export function lookupMatchRow(
  rows: LookupRow[],
  axes: AxisDefinition[],
  queryValues: Record<string, unknown>
): LookupRow | null {
  for (const row of rows) {
    const cond = row.conditions as Record<string, unknown>;
    let allMatch = true;
    for (const axis of axes) {
      const q = queryValues[axis.variable_code];
      if (axis.match_type === "EXACT") {
        if (cond[axis.variable_code] !== q) {
          allMatch = false;
          break;
        }
      } else if (axis.match_type === "RANGE") {
        const min = Number(cond[`${axis.variable_code}_min`]);
        const max = Number(cond[`${axis.variable_code}_max`]);
        const qn = Number(q);
        if (Number.isNaN(qn) || qn < min || qn >= max) {
          allMatch = false;
          break;
        }
      } else if (axis.match_type === "PREFIX") {
        const pattern = String(cond[axis.variable_code] ?? "");
        if (!String(q ?? "").startsWith(pattern)) {
          allMatch = false;
          break;
        }
      }
    }
    if (allMatch) return row;
  }
  return null;
}

/**
 * LOOKUP 値を解決
 * @returns 数値 or null（マッチなし）
 */
export function resolveLookupValue(
  rows: LookupRow[],
  axes: AxisDefinition[],
  queryValues: Record<string, unknown>
): number | null {
  const row = lookupMatchRow(rows, axes, queryValues);
  if (!row) return null;
  // CONSTANT: そのまま return_value
  // LINEAR: range 軸の値で線形補間
  if (row.interpolation === "LINEAR" && row.return_value_max != null) {
    // RANGE 軸を見つけて補間
    const rangeAxis = axes.find((a) => a.match_type === "RANGE");
    if (rangeAxis) {
      const cond = row.conditions as Record<string, unknown>;
      const min = Number(cond[`${rangeAxis.variable_code}_min`]);
      const max = Number(cond[`${rangeAxis.variable_code}_max`]);
      const q = Number(queryValues[rangeAxis.variable_code]);
      if (!Number.isNaN(min) && !Number.isNaN(max) && !Number.isNaN(q) && max > min) {
        const t = (q - min) / (max - min);
        return row.return_value + t * (row.return_value_max - row.return_value);
      }
    }
  }
  return row.return_value;
}

// ────────────────────────────────────────────────────────────────────
// 式評価
// ────────────────────────────────────────────────────────────────────

/**
 * formula を変数バインディングとともに評価
 *
 * @returns 数値 or null（評価失敗）
 */
export function evaluateFormula(
  formula: string,
  scope: Record<string, number | string | null>
): number | null {
  // null 値があれば計算不可
  for (const v of Object.values(scope)) {
    if (v === null || v === undefined) return null;
  }
  try {
    const result = math.evaluate(formula, scope);
    if (typeof result === "number" && Number.isFinite(result)) return result;
    return null;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// 変数の解決（formula が要求する変数すべて）
// ────────────────────────────────────────────────────────────────────

export interface ResolvedVariable {
  code: string;
  source: "MANUAL" | "PATH" | "LOOKUP";
  value: number | string | null;
  label: string;
  /** UI 上ロック表示（PATH/LOOKUP は手で書き換えられない） */
  locked: boolean;
}

/**
 * formula に必要な全変数を解決
 *
 * @param requiredCodes 計算式が要求する変数コード一覧
 * @param variableDefs 変数定義一覧（メタ情報）
 * @param manualValues 手入力済の値
 * @param pathNodes 経路上のノード（PATH変数解決用）
 * @param lookupContext LOOKUP のテーブル名→ {axes, rows} のマップ。LOOKUP変数で使う
 */
export function resolveAllVariables(
  requiredCodes: string[],
  variableDefs: VariableDefinition[],
  manualValues: Record<string, number | string>,
  pathNodes: SelectionTreeNode[],
  lookupContext: Map<string, { axes: AxisDefinition[]; rows: LookupRow[] }>
): ResolvedVariable[] {
  const result: ResolvedVariable[] = [];

  for (const code of requiredCodes) {
    const def = variableDefs.find((v) => v.code === code);
    if (!def) {
      result.push({
        code,
        source: "MANUAL",
        value: null,
        label: code,
        locked: false,
      });
      continue;
    }

    if (def.source === "PATH") {
      const pathKey = (def as VariableDefinition & { path_key?: string | null })
        .path_key;
      const value = pathKey ? resolvePathVariable(pathNodes, pathKey) : null;
      result.push({
        code,
        source: "PATH",
        value,
        label: def.label,
        locked: true,
      });
    } else if (def.source === "LOOKUP") {
      // LOOKUP 変数は別途解決ロジックを呼ぶ前提（現行は table 名指定のフックが無いので空）
      result.push({
        code,
        source: "LOOKUP",
        value: null,
        label: def.label,
        locked: true,
      });
    } else {
      // MANUAL
      const v = manualValues[code];
      result.push({
        code,
        source: "MANUAL",
        value: v ?? (def.default_value ?? null),
        label: def.label,
        locked: false,
      });
    }
  }

  // LOOKUP 変数の解決（他変数が解決済みになったあと）
  // 例: 歩留まり Y は material_title (PATH経由) と d (MANUAL) でルックアップ
  for (const v of result) {
    if (v.source === "LOOKUP") {
      // テーブル名は、現状の seed では variable.code='Y' → '歩留まり表'
      // 簡略化: lookupContext のすべてのテーブルから順に試す
      const queryValues: Record<string, unknown> = {};
      for (const r of result) {
        if (r.value != null) queryValues[r.code] = r.value;
      }
      // path 上のノードマスタ値の title も追加（material_title 等のキーで参照）
      for (const node of pathNodes) {
        const vals = node.node_master_value?.values as
          | Record<string, unknown>
          | null
          | undefined;
        if (vals && typeof vals.title === "string") {
          // ノードマスタ名_title みたいなキーは作れないので、material_title 等の慣習に頼る
          // 簡略化: 'material_title' という固定キー
          queryValues["material_title"] = vals.title;
        }
      }

      let resolved: number | null = null;
      for (const [, ctx] of lookupContext) {
        resolved = resolveLookupValue(ctx.rows, ctx.axes, queryValues);
        if (resolved != null) break;
      }
      v.value = resolved;
    }
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────
// 丸め
// ────────────────────────────────────────────────────────────────────

export type RoundingMethod = "FLOOR" | "CEIL" | "ROUND";

/**
 * 数値を桁数で丸める
 * @param digits 正: 小数点以下、負: 整数桁（例: -2 → 100円単位）
 */
export function roundValue(
  value: number,
  method: RoundingMethod,
  digits: number
): number {
  const factor = Math.pow(10, digits);
  const scaled = value * factor;
  let rounded: number;
  switch (method) {
    case "FLOOR":
      rounded = Math.floor(scaled);
      break;
    case "CEIL":
      rounded = Math.ceil(scaled);
      break;
    case "ROUND":
    default:
      rounded = Math.round(scaled);
      break;
  }
  return rounded / factor;
}

// ────────────────────────────────────────────────────────────────────
// 上書き 3 レバーの適用
// ────────────────────────────────────────────────────────────────────

/**
 * 採用値 = override_value があればそれ、無ければ computed * multiplier + adjustment
 */
export function applyOverrides(
  computed: number | null,
  multiplier: number,
  adjustment: number,
  overrideValue: number | null
): number | null {
  if (overrideValue != null) return overrideValue;
  if (computed == null) return null;
  return computed * multiplier + adjustment;
}

// ────────────────────────────────────────────────────────────────────
// 中計（G式適用）
// ────────────────────────────────────────────────────────────────────

/**
 * カテゴリの中計を計算
 *
 * @param subtotals 各明細の小計の配列
 * @param gTemplateBuiltinKey G_pass / G_outsource / G_margin
 * @param categoryMargin G_margin 用（0.10 = 10%）
 * @param transports 運賃の配列（G_outsource 用）
 */
export function computeCategoryTotal(
  subtotals: number[],
  gTemplateBuiltinKey: string | null,
  categoryMargin: number,
  transports: number[] = []
): number {
  const sumSub = subtotals.reduce((a, b) => a + b, 0);
  switch (gTemplateBuiltinKey) {
    case "G_outsource":
      return sumSub + transports.reduce((a, b) => a + b, 0);
    case "G_margin":
      return sumSub * (1 + categoryMargin);
    case "G_pass":
    default:
      return sumSub;
  }
}

// ────────────────────────────────────────────────────────────────────
// 葉ノードまでの経路を取得
// ────────────────────────────────────────────────────────────────────

/**
 * すべてのノードから、ターゲットノードまでの経路（root → target）を取得
 */
export function getPathToNode(
  allNodes: SelectionTreeNode[],
  targetId: string
): SelectionTreeNode[] {
  const map = new Map<string, SelectionTreeNode>(
    allNodes.map((n) => [n.id, n])
  );
  const path: SelectionTreeNode[] = [];
  let current = map.get(targetId);
  while (current) {
    path.unshift(current);
    if (!current.parent_id) break;
    current = map.get(current.parent_id);
  }
  return path;
}
