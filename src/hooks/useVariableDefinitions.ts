import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type VariableDefinition = Database["public"]["Tables"]["variable_definitions"]["Row"];
export type VariableDefinitionInsert = Database["public"]["Tables"]["variable_definitions"]["Insert"];
export type VariableDefinitionUpdate = Database["public"]["Tables"]["variable_definitions"]["Update"];

export const VARIABLE_TYPES = ["NUMBER", "STRING", "BOOLEAN", "SELECT"] as const;
export const VARIABLE_SOURCES = ["MANUAL", "MASTER", "LOOKUP", "PATH"] as const;
export const VARIABLE_SOURCE_ENTITIES = ["MATERIAL", "PROCESS", "CUSTOMER"] as const;

export function useVariableDefinitions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["variable_definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("variable_definitions")
        .select("*, unit:units(id, code, name)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateVariableDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: VariableDefinitionInsert) => {
      const { data, error } = await supabase
        .from("variable_definitions")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_definitions"] });
    },
  });
}

export function useUpdateVariableDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & VariableDefinitionUpdate) => {
      const { data, error } = await supabase
        .from("variable_definitions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_definitions"] });
    },
  });
}

export function useDeleteVariableDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("variable_definitions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_definitions"] });
    },
  });
}
