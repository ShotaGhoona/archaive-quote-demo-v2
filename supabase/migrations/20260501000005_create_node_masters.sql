-- ============================================
-- ノードマスタ + ノードマスタ値
-- 「材料項目」「材料種別」「計算ベース」など、選択肢の種類とその個別値
-- ============================================

-- ノードマスタ（種類）
CREATE TABLE public.node_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  attribute_schema JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_node_masters_updated_at BEFORE UPDATE ON public.node_masters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.node_masters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.node_masters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.node_masters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ノードマスタ値（個別の値）
CREATE TABLE public.node_master_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_master_id UUID NOT NULL REFERENCES public.node_masters(id) ON DELETE CASCADE,
  values JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_node_master_values_master ON public.node_master_values(node_master_id);
CREATE TRIGGER update_node_master_values_updated_at BEFORE UPDATE ON public.node_master_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.node_master_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.node_master_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.node_master_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
