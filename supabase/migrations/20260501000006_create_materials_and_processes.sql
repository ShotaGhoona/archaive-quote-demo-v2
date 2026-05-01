-- ============================================
-- 材料マスタ + 工程マスタ
-- ============================================

-- 材料
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  unit_price NUMERIC NOT NULL,
  attributes JSONB DEFAULT '{}',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_materials_code ON public.materials(material_code);
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 工程
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category public.process_category NOT NULL,
  cost_type public.process_cost_type NOT NULL DEFAULT 'HOURLY',
  hourly_rate NUMERIC,
  fixed_cost NUMERIC,
  unit_cost NUMERIC,
  setup_time_default NUMERIC,
  attributes JSONB DEFAULT '{}',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_processes_code ON public.processes(process_code);
CREATE INDEX idx_processes_category ON public.processes(category);
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.processes FOR ALL TO authenticated USING (true) WITH CHECK (true);
