-- ============================================
-- 選択肢の木（カテゴリごとの階層構造）
-- 葉ノードは formula_template_id を持つ
-- ============================================

CREATE TABLE public.selection_tree_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.selection_tree_nodes(id) ON DELETE CASCADE,
  category public.quote_category NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,

  -- 役割 A: ナビゲーション
  node_master_value_id UUID REFERENCES public.node_master_values(id) ON DELETE SET NULL,

  -- 役割 B: マスタ参照（polymorphic、FK 制約なし）
  master_entity TEXT,
  master_id UUID,

  -- 役割 C: 固定変数
  fixed_variables JSONB,

  -- 役割 D: 計算式テンプレート（葉のみ）
  formula_template_id UUID REFERENCES public.formula_templates(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_selection_tree_nodes_parent ON public.selection_tree_nodes(parent_id);
CREATE INDEX idx_selection_tree_nodes_category ON public.selection_tree_nodes(category);
CREATE INDEX idx_selection_tree_nodes_formula ON public.selection_tree_nodes(formula_template_id);
CREATE TRIGGER update_selection_tree_nodes_updated_at BEFORE UPDATE ON public.selection_tree_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.selection_tree_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.selection_tree_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.selection_tree_nodes FOR ALL TO authenticated USING (true) WITH CHECK (true);
