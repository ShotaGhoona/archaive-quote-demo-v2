import { useMemo } from "react";
import { useLookupTables } from "@/hooks/useLookupTables";
import { useLookupRows } from "@/hooks/useLookupRows";
import type { AxisDefinition } from "@/hooks/useLookupTables";
import type { LookupRow } from "@/hooks/useLookupRows";

/**
 * 計算用の LOOKUP コンテキストを構築する。
 * 現状は最初の LOOKUP テーブルの ACTIVE バージョンのみ（簡略化）。
 */
export function useLookupContext() {
  const { data: lookupTables } = useLookupTables();

  const firstActiveVersionId = useMemo(() => {
    const t = (lookupTables ?? [])[0];
    if (!t) return null;
    type V = { id: string; status: string };
    const versions = (t as { lookup_table_versions?: V[] } | undefined)
      ?.lookup_table_versions ?? [];
    return versions.find((v) => v.status === "ACTIVE")?.id ?? null;
  }, [lookupTables]);

  const { data: rows } = useLookupRows(firstActiveVersionId);

  return useMemo(() => {
    const map = new Map<string, { axes: AxisDefinition[]; rows: LookupRow[] }>();
    const t = (lookupTables ?? [])[0];
    if (t && rows && rows.length > 0) {
      const axes = Array.isArray(t.axes)
        ? (t.axes as unknown as AxisDefinition[])
        : [];
      map.set(t.name, { axes, rows });
    }
    return map;
  }, [lookupTables, rows]);
}
