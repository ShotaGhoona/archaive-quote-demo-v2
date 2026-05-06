-- ============================================
-- Item（製品） + 見積もりヘッダー / 数量バリエーション / 中計 / 明細（小計）
-- ============================================

-- Item（製品）
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  drawing_url TEXT,
  remarks TEXT,
  -- created_by は auth.users への soft reference（FK 制約は付けない、認証状態に依存しない）
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_items_code ON public.items(item_code);
CREATE INDEX idx_items_customer ON public.items(customer_id);
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 見積もりヘッダー
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  -- 表示用の番号。一意性は (item_id, version) で担保するので UNIQUE を付けない
  quote_number TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,

  margin_mode public.margin_mode NOT NULL,
  total_margin NUMERIC,
  total_margin_table_id UUID,
  rounding_method public.rounding_method NOT NULL DEFAULT 'ROUND',
  rounding_digits INT NOT NULL DEFAULT 0,

  total_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  total_adjustment NUMERIC NOT NULL DEFAULT 0,
  total_override NUMERIC,

  computed_total NUMERIC,
  final_total NUMERIC,

  remarks TEXT,
  -- soft reference（FK 制約なし）
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- 1 Item + version は一意 → upsert(onConflict="item_id,version") で冪等化
  UNIQUE (item_id, version)
);

CREATE INDEX idx_quotes_item ON public.quotes(item_id);
CREATE INDEX idx_quotes_number ON public.quotes(quote_number);
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 数量バリエーション
CREATE TABLE public.quote_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  is_default BOOLEAN DEFAULT false,
  computed_total NUMERIC,
  final_total NUMERIC,
  unit_price NUMERIC,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- 1 quote 内で sort_order は一意 → upsert で冪等化
  UNIQUE (quote_id, sort_order)
);

CREATE INDEX idx_quote_lots_quote ON public.quote_lots(quote_id);
CREATE TRIGGER update_quote_lots_updated_at BEFORE UPDATE ON public.quote_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quote_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.quote_lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.quote_lots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 中計（カテゴリ単位の集計と上書き）
CREATE TABLE public.quote_category_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_lot_id UUID NOT NULL REFERENCES public.quote_lots(id) ON DELETE CASCADE,
  category public.quote_category NOT NULL,

  g_template_id UUID REFERENCES public.formula_templates(id),
  g_params JSONB DEFAULT '{}',

  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  adjustment NUMERIC NOT NULL DEFAULT 0,
  override_value NUMERIC,

  computed_value NUMERIC,
  final_value NUMERIC,

  UNIQUE (quote_lot_id, category)
);

CREATE INDEX idx_quote_category_totals_lot ON public.quote_category_totals(quote_lot_id);

ALTER TABLE public.quote_category_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.quote_category_totals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.quote_category_totals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 明細（小計）
CREATE TABLE public.quote_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_lot_id UUID NOT NULL REFERENCES public.quote_lots(id) ON DELETE CASCADE,
  category public.quote_category NOT NULL,

  selection_path UUID[],
  leaf_node_id UUID REFERENCES public.selection_tree_nodes(id) ON DELETE SET NULL,
  formula_template_id UUID REFERENCES public.formula_templates(id) ON DELETE SET NULL,

  variable_values JSONB DEFAULT '{}',

  transport_cost NUMERIC DEFAULT 0,

  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  adjustment NUMERIC NOT NULL DEFAULT 0,
  override_value NUMERIC,

  computed_value NUMERIC,
  final_value NUMERIC,

  lookup_versions_used JSONB DEFAULT '[]',

  sort_order INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quote_details_lot ON public.quote_details(quote_lot_id);
CREATE INDEX idx_quote_details_category ON public.quote_details(quote_lot_id, category);
CREATE TRIGGER update_quote_details_updated_at BEFORE UPDATE ON public.quote_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quote_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.quote_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.quote_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- quotes.total_margin_table_id の FK を追加（lookup_tables は前のマイグレーションで作成済み）
ALTER TABLE public.quotes
  ADD CONSTRAINT fk_quotes_margin_table
  FOREIGN KEY (total_margin_table_id) REFERENCES public.lookup_tables(id) ON DELETE SET NULL;
