import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import type { AttributeSchema } from "@/types/nodeMaster";

type Row = Database["public"]["Tables"]["node_masters"]["Row"];

export type NodeMaster = Omit<Row, "attribute_schema"> & {
  attribute_schema: AttributeSchema;
};

export function useNodeMasters() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["node_masters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("node_masters")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as NodeMaster[];
    },
    enabled: !!user,
  });
}

export function useCreateNodeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      attribute_schema: AttributeSchema;
    }) => {
      const { data, error } = await supabase
        .from("node_masters")
        .insert({
          name: input.name,
          description: input.description ?? null,
          attribute_schema: input.attribute_schema,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["node_masters"] });
    },
  });
}

export function useUpdateNodeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string | null;
      attribute_schema?: AttributeSchema;
    }) => {
      const { data, error } = await supabase
        .from("node_masters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["node_masters"] });
    },
  });
}

export function useDeleteNodeMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("node_masters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["node_masters"] });
      queryClient.invalidateQueries({ queryKey: ["node_master_values"] });
    },
  });
}
