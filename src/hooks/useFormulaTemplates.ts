import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database, Json } from "@/integrations/supabase/types";
import type { QuoteCategory } from "./useSelectionTreeNodes";

export type FormulaTemplate =
  Database["public"]["Tables"]["formula_templates"]["Row"];

export type FormulaTemplateInsert =
  Database["public"]["Tables"]["formula_templates"]["Insert"];

/**
 * F テンプレート一覧
 * - category 指定時: そのカテゴリのみ
 * - category 未指定 / null: すべての F テンプレート
 */
export function useFormulaTemplates(category?: QuoteCategory | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["formula_templates", "F", category ?? "__all__"],
    queryFn: async () => {
      let q = supabase.from("formula_templates").select("*").eq("kind", "F");
      if (category) q = q.eq("category", category);
      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

/** G テンプレート一覧（kind='G'、ビルトイン含む） */
export function useGFormulaTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["formula_templates", "G"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formula_templates")
        .select("*")
        .eq("kind", "G")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

/** 単体取得 */
export function useFormulaTemplate(id: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["formula_template", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("formula_templates")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateFormulaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      formula: string;
      description?: string | null;
      category?: QuoteCategory | null;
      variables: Json;
    }) => {
      const { data, error } = await supabase
        .from("formula_templates")
        .insert({
          name: input.name,
          formula: input.formula,
          description: input.description ?? null,
          category: input.category ?? null,
          kind: "F",
          variables: input.variables,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formula_templates"] });
    },
  });
}

export function useUpdateFormulaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      formula?: string;
      description?: string | null;
      category?: QuoteCategory | null;
      variables?: Json;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("formula_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formula_templates"] });
      queryClient.invalidateQueries({ queryKey: ["formula_template"] });
    },
  });
}

export function useDeleteFormulaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("formula_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formula_templates"] });
      queryClient.invalidateQueries({ queryKey: ["selection_tree_nodes"] });
    },
  });
}
