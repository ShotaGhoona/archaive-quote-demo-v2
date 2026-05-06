-- ============================================
-- 変数定義 + 計算式テンプレート
-- 変数の値はノードマスタの values JSONB（PATH）/ 手入力（MANUAL）/ LOOKUP から解決
-- variable_definitions.lookup_table_id の FK は LOOKUP マイグレーションで後付け
-- ============================================

-- 変数定義
CREATE TABLE public.variable_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  type public.variable_type NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  source public.variable_source NOT NULL,
  -- PATH 用: 経路上のノード値の JSON キー（例: 'density', 'unit_price', 'hourly_rate'）
  path_key TEXT,
  -- LOOKUP 用
  lookup_table_id UUID,
  -- SELECT 型のオプション
  options JSONB,
  default_value NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_variable_definitions_updated_at BEFORE UPDATE ON public.variable_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.variable_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.variable_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.variable_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 計算式テンプレート
CREATE TABLE public.formula_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind public.formula_kind NOT NULL,
  category public.quote_category,
  formula TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  description TEXT,
  is_builtin BOOLEAN DEFAULT false,
  builtin_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_formula_templates_kind ON public.formula_templates(kind);
CREATE INDEX idx_formula_templates_category ON public.formula_templates(category);
CREATE TRIGGER update_formula_templates_updated_at BEFORE UPDATE ON public.formula_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.formula_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.formula_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.formula_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
