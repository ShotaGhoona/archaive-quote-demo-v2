import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database, Json } from "@/integrations/supabase/types";

export type SelectionTreeNodeRow =
  Database["public"]["Tables"]["selection_tree_nodes"]["Row"];

export type SelectionTreeNode = SelectionTreeNodeRow & {
  node_master_value: {
    id: string;
    node_master_id: string;
    values: Json;
  } | null;
};

export type QuoteCategory = "MATERIAL" | "IN_HOUSE" | "OUTSOURCE" | "PURCHASE" | "EXPENSE";

export const QUOTE_CATEGORIES: { id: QuoteCategory; label: string }[] = [
  { id: "MATERIAL", label: "材料費" },
  { id: "IN_HOUSE", label: "工程費" },
  { id: "OUTSOURCE", label: "外注費" },
  { id: "PURCHASE", label: "購入品" },
  { id: "EXPENSE", label: "諸経費" },
];

/** カテゴリ全件を取得（クライアント側で parent_id 別にマップ化） */
export function useSelectionTreeNodes(category: QuoteCategory | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["selection_tree_nodes", category],
    queryFn: async () => {
      if (!category) return [] as SelectionTreeNode[];
      const { data, error } = await supabase
        .from("selection_tree_nodes")
        .select(
          `*, node_master_value:node_master_values(id, node_master_id, values)`
        )
        .eq("category", category)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SelectionTreeNode[];
    },
    enabled: !!user && !!category,
  });
}

/** ある親の子ノードを全削除（消去用） */
export function useDeleteAllChildren() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { parentId: string; category: QuoteCategory }) => {
      const { error } = await supabase
        .from("selection_tree_nodes")
        .delete()
        .eq("parent_id", input.parentId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_tree_nodes", variables.category],
      });
    },
  });
}

/** 1 列分の値集合を更新（差分で INSERT / DELETE） */
export function useUpdateColumnValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      category: QuoteCategory;
      parentId: string | null;
      /** 新しいノードマスタ */
      nodeMasterId: string;
      /** 採用する値の id 一覧（順序保持） */
      targetValueIds: string[];
      /** 既存の子ノード（差分計算用） */
      currentChildren: SelectionTreeNode[];
    }) => {
      const {
        category,
        parentId,
        nodeMasterId,
        targetValueIds,
        currentChildren,
      } = input;

      // 既存の子のうち、選択されたままの value_id 集合
      const targetSet = new Set(targetValueIds);

      // 削除対象（残った子のうち、target に含まれない or master が変わった）
      const toDelete: string[] = [];
      const keptValueIds = new Set<string>();
      for (const c of currentChildren) {
        const cMasterId = c.node_master_value?.node_master_id;
        if (
          cMasterId !== nodeMasterId ||
          !c.node_master_value_id ||
          !targetSet.has(c.node_master_value_id)
        ) {
          toDelete.push(c.id);
        } else {
          keptValueIds.add(c.node_master_value_id);
        }
      }

      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("selection_tree_nodes")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }

      // 追加対象（target にあるが既存に無い）
      const toInsertValueIds = targetValueIds.filter(
        (vid) => !keptValueIds.has(vid)
      );

      if (toInsertValueIds.length > 0) {
        // 値の title を取得してラベルにする
        const { data: values, error: valuesError } = await supabase
          .from("node_master_values")
          .select("id, values")
          .in("id", toInsertValueIds);
        if (valuesError) throw valuesError;

        const baseSort = currentChildren.length - toDelete.length;
        const inserts = toInsertValueIds.map((vid, i) => {
          const v = values?.find((x) => x.id === vid);
          const title = (v?.values as Record<string, unknown> | null)?.title;
          const label = typeof title === "string" && title ? title : "(無題)";
          return {
            category,
            parent_id: parentId,
            label,
            sort_order: baseSort + i + 1,
            node_master_value_id: vid,
          };
        });

        const { error: insertError } = await supabase
          .from("selection_tree_nodes")
          .insert(inserts);
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["selection_tree_nodes", variables.category],
      });
    },
  });
}
