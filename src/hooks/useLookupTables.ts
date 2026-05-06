import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database, Json } from "@/integrations/supabase/types";

export type LookupTable = Database["public"]["Tables"]["lookup_tables"]["Row"];
export type LookupTableVersion =
  Database["public"]["Tables"]["lookup_table_versions"]["Row"];

export const MATCH_TYPES = ["EXACT", "RANGE", "PREFIX"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export interface AxisDefinition {
  variable_code: string;
  match_type: MatchType;
  axis_order: number;
}

/** 一覧（バージョン1件 + 行件数を集計） */
export function useLookupTables() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lookup_tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lookup_tables")
        .select(
          "*, lookup_table_versions(id, version_number, status, lookup_rows(count))"
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

/** 単体取得 */
export function useLookupTable(id: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lookup_table", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("lookup_tables")
        .select("*, lookup_table_versions(id, version_number, status)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateLookupTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      axes: AxisDefinition[];
    }) => {
      // テーブル作成
      const { data: table, error: tableError } = await supabase
        .from("lookup_tables")
        .insert({
          name: input.name,
          description: input.description ?? null,
          axes: input.axes as unknown as Json,
        })
        .select()
        .single();
      if (tableError) throw tableError;

      // 初版を作成（ACTIVE）
      const { error: versionError } = await supabase
        .from("lookup_table_versions")
        .insert({
          lookup_table_id: table.id,
          version_number: 1,
          status: "ACTIVE",
          description: "初版",
        });
      if (versionError) throw versionError;

      return table;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookup_tables"] });
    },
  });
}

export function useUpdateLookupTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string | null;
      axes?: AxisDefinition[];
    }) => {
      const { id, axes, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest };
      if (axes !== undefined) updates.axes = axes;

      const { data, error } = await supabase
        .from("lookup_tables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookup_tables"] });
      queryClient.invalidateQueries({ queryKey: ["lookup_table"] });
    },
  });
}

export function useDeleteLookupTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lookup_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lookup_tables"] });
    },
  });
}

/** ACTIVE バージョンを取得 */
export function useActiveLookupVersion(lookupTableId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lookup_active_version", lookupTableId],
    queryFn: async () => {
      if (!lookupTableId) return null;
      const { data, error } = await supabase
        .from("lookup_table_versions")
        .select("*")
        .eq("lookup_table_id", lookupTableId)
        .eq("status", "ACTIVE")
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!lookupTableId,
  });
}
