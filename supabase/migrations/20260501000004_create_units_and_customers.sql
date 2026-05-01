-- ============================================
-- 単位マスタ + 取引先マスタ
-- ============================================

-- 単位マスタ
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dimension TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.units FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 取引先マスタ
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_kana TEXT,
  customer_type TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (customer_type IN ('CUSTOMER', 'SUPPLIER', 'BOTH')),
  rank TEXT CHECK (rank IN ('A', 'B', 'C', 'D')),
  remarks TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_type ON public.customers(customer_type);
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
