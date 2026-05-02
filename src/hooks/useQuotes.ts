import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database, Json } from "@/integrations/supabase/types";

export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteLot = Database["public"]["Tables"]["quote_lots"]["Row"];
export type QuoteDetail = Database["public"]["Tables"]["quote_details"]["Row"];

/**
 * Item の見積もり（最初の quote）と最初の lot を冪等に確保する。
 *
 * 設計:
 * - quotes に UNIQUE (item_id, version) があるので、同じ item_id, version=1 の upsert は1行にしかならない
 * - quote_lots に UNIQUE (quote_id, sort_order) があるので、同じ quote_id, sort_order=1 の upsert も1行
 * - ignoreDuplicates: true で「あれば何もしない、無ければ作る」の冪等動作
 * - 二重発火・複数タブ・リトライ何度起きても破壊されない
 */
export function useEnsureQuote(itemId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quote_for_item", itemId],
    queryFn: async () => {
      if (!itemId) return null;

      // 1. quote を冪等に作成（既存があれば何もしない）
      const quoteNumber = `Q-${itemId}-1`;
      const { error: upsertErr } = await supabase
        .from("quotes")
        .upsert(
          {
            item_id: itemId,
            quote_number: quoteNumber,
            version: 1,
            margin_mode: "CATEGORY",
            rounding_method: "ROUND",
            rounding_digits: -2,
            created_by: user?.id ?? null,
          },
          { onConflict: "item_id,version", ignoreDuplicates: true }
        );
      if (upsertErr) throw upsertErr;

      // 2. quote を読み戻し（必ず存在する）
      const { data: quote, error: readErr } = await supabase
        .from("quotes")
        .select("*")
        .eq("item_id", itemId)
        .eq("version", 1)
        .single();
      if (readErr) throw readErr;

      // 3. lot を冪等に作成
      const { error: lotUpsertErr } = await supabase
        .from("quote_lots")
        .upsert(
          {
            quote_id: quote.id,
            quantity: 1,
            is_default: true,
            sort_order: 1,
          },
          { onConflict: "quote_id,sort_order", ignoreDuplicates: true }
        );
      if (lotUpsertErr) throw lotUpsertErr;

      // 4. lot を読み戻し
      const { data: lot, error: lotReadErr } = await supabase
        .from("quote_lots")
        .select("*")
        .eq("quote_id", quote.id)
        .eq("sort_order", 1)
        .single();
      if (lotReadErr) throw lotReadErr;

      return { quote, lot };
    },
    enabled: !!user && !!itemId,
    retry: false,
  });
}

/** 明細一覧（lot配下のすべて） */
export function useQuoteDetails(lotId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quote_details", lotId],
    queryFn: async () => {
      if (!lotId) return [] as QuoteDetail[];
      const { data, error } = await supabase
        .from("quote_details")
        .select("*")
        .eq("quote_lot_id", lotId)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!lotId,
  });
}

export function useCreateQuoteDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      quote_lot_id: string;
      category: Database["public"]["Enums"]["quote_category"];
      leaf_node_id?: string | null;
      formula_template_id?: string | null;
      selection_path?: string[];
      variable_values?: Record<string, unknown>;
      computed_value?: number | null;
      transport_cost?: number;
    }) => {
      const { data, error } = await supabase
        .from("quote_details")
        .insert({
          quote_lot_id: input.quote_lot_id,
          category: input.category,
          leaf_node_id: input.leaf_node_id ?? null,
          formula_template_id: input.formula_template_id ?? null,
          selection_path: input.selection_path ?? [],
          variable_values: (input.variable_values ?? {}) as unknown as Json,
          computed_value: input.computed_value ?? null,
          final_value: input.computed_value ?? null,
          transport_cost: input.transport_cost ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["quote_details", variables.quote_lot_id],
      });
    },
  });
}

export function useUpdateQuoteDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      quote_lot_id: string;
      leaf_node_id?: string | null;
      formula_template_id?: string | null;
      selection_path?: string[];
      variable_values?: Record<string, unknown>;
      computed_value?: number | null;
      transport_cost?: number;
    }) => {
      const { id, quote_lot_id, ...rest } = input;
      const updates: Record<string, unknown> = {};
      if (rest.leaf_node_id !== undefined) updates.leaf_node_id = rest.leaf_node_id;
      if (rest.formula_template_id !== undefined)
        updates.formula_template_id = rest.formula_template_id;
      if (rest.selection_path !== undefined) updates.selection_path = rest.selection_path;
      if (rest.variable_values !== undefined) updates.variable_values = rest.variable_values;
      if (rest.computed_value !== undefined) {
        updates.computed_value = rest.computed_value;
        updates.final_value = rest.computed_value;
      }
      if (rest.transport_cost !== undefined) updates.transport_cost = rest.transport_cost;
      const { data, error } = await supabase
        .from("quote_details")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, quote_lot_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["quote_details", result.quote_lot_id],
      });
    },
  });
}

export function useDeleteQuoteDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; quote_lot_id: string }) => {
      const { error } = await supabase
        .from("quote_details")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["quote_details", variables.quote_lot_id],
      });
    },
  });
}
