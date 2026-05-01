-- ============================================
-- 会社設定（シングルトン）
-- ============================================

CREATE TABLE public.quote_formula_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  margin_mode public.margin_mode NOT NULL DEFAULT 'CATEGORY',
  total_margin NUMERIC DEFAULT 0,
  total_margin_table_id UUID REFERENCES public.lookup_tables(id),
  rounding_method public.rounding_method NOT NULL DEFAULT 'ROUND',
  rounding_digits INT NOT NULL DEFAULT 0,
  category_margins JSONB DEFAULT '{"MATERIAL":0,"IN_HOUSE":0,"OUTSOURCE":0,"PURCHASE":0,"EXPENSE":0}',
  enabled_categories JSONB DEFAULT '["MATERIAL","IN_HOUSE","OUTSOURCE","PURCHASE","EXPENSE"]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quote_formula_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.quote_formula_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.quote_formula_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
