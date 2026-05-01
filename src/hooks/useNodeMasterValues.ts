import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import type { NodeMasterValueData } from "@/types/nodeMaster";

type Row = Database["public"]["Tables"]["node_master_values"]["Row"];

export type NodeMasterValue = Omit<Row, "values"> & {
  values: NodeMasterValueData;
};

export function useNodeMasterValues(nodeMasterId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["node_master_values", nodeMasterId],
    queryFn: async () => {
      if (!nodeMasterId) return [];
      const { data, error } = await supabase
        .from("node_master_values")
        .select("*")
        .eq("node_master_id", nodeMasterId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as NodeMasterValue[];
    },
    enabled: !!user && !!nodeMasterId,
  });
}

export function useCreateNodeMasterValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      node_master_id: string;
      values: NodeMasterValueData;
    }) => {
      const { data, error } = await supabase
        .from("node_master_values")
        .insert({
          node_master_id: input.node_master_id,
          values: input.values,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["node_master_values", variables.node_master_id],
      });
    },
  });
}

export function useUpdateNodeMasterValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      node_master_id: string;
      values: NodeMasterValueData;
    }) => {
      const { data, error } = await supabase
        .from("node_master_values")
        .update({ values: input.values })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["node_master_values", variables.node_master_id],
      });
    },
  });
}

export function useDeleteNodeMasterValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; node_master_id: string }) => {
      const { error } = await supabase
        .from("node_master_values")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["node_master_values", variables.node_master_id],
      });
    },
  });
}
