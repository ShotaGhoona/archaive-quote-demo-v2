import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database, Json } from "@/integrations/supabase/types";

export type LookupRow = Database["public"]["Tables"]["lookup_rows"]["Row"];

export const INTERPOLATIONS = ["CONSTANT", "LINEAR"] as const;
export type Interpolation = (typeof INTERPOLATIONS)[number];

export function useLookupRows(versionId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lookup_rows", versionId],
    queryFn: async () => {
      if (!versionId) return [] as LookupRow[];
      const { data, error } = await supabase
        .from("lookup_rows")
        .select("*")
        .eq("version_id", versionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!versionId,
  });
}

export function useCreateLookupRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      version_id: string;
      conditions: Record<string, unknown>;
      return_value: number;
      return_value_max?: number | null;
      interpolation: Interpolation;
    }) => {
      const { data, error } = await supabase
        .from("lookup_rows")
        .insert({
          version_id: input.version_id,
          conditions: input.conditions as unknown as Json,
          return_value: input.return_value,
          return_value_max: input.return_value_max ?? null,
          interpolation: input.interpolation,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lookup_rows", variables.version_id],
      });
    },
  });
}

export function useUpdateLookupRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      version_id: string;
      conditions: Record<string, unknown>;
      return_value: number;
      return_value_max?: number | null;
      interpolation: Interpolation;
    }) => {
      const { data, error } = await supabase
        .from("lookup_rows")
        .update({
          conditions: input.conditions as unknown as Json,
          return_value: input.return_value,
          return_value_max: input.return_value_max ?? null,
          interpolation: input.interpolation,
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lookup_rows", variables.version_id],
      });
    },
  });
}

export function useDeleteLookupRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; version_id: string }) => {
      const { error } = await supabase
        .from("lookup_rows")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lookup_rows", variables.version_id],
      });
    },
  });
}
