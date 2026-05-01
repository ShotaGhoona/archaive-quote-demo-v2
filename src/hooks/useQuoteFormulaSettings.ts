import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import type { QuoteCategory } from "./useSelectionTreeNodes";

export type QuoteFormulaSettings =
  Database["public"]["Tables"]["quote_formula_settings"]["Row"];

export function useQuoteFormulaSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quote_formula_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_formula_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useToggleEnabledCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      category: QuoteCategory;
      currentEnabled: QuoteCategory[];
      enable: boolean;
    }) => {
      const next = input.enable
        ? Array.from(new Set([...input.currentEnabled, input.category]))
        : input.currentEnabled.filter((c) => c !== input.category);

      const { data, error } = await supabase
        .from("quote_formula_settings")
        .update({ enabled_categories: next })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_formula_settings"] });
    },
  });
}
