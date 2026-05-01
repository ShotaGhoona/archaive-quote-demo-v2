-- ============================================
-- LOOKUP テーブル + バージョン + 行データ
-- variable_definitions.lookup_table_id の FK もここで後付け
-- ============================================

-- LOOKUP テーブル
CREATE TABLE public.lookup_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  axes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_lookup_tables_updated_at BEFORE UPDATE ON public.lookup_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lookup_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.lookup_tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.lookup_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- variable_definitions.lookup_table_id の FK を後付け
ALTER TABLE public.variable_definitions
  ADD CONSTRAINT fk_var_def_lookup
  FOREIGN KEY (lookup_table_id) REFERENCES public.lookup_tables(id) ON DELETE SET NULL;

-- LOOKUP バージョン
CREATE TABLE public.lookup_table_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookup_table_id UUID NOT NULL REFERENCES public.lookup_tables(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  status public.lookup_version_status NOT NULL DEFAULT 'ACTIVE',
  description TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (lookup_table_id, version_number)
);

CREATE INDEX idx_lookup_versions_table ON public.lookup_table_versions(lookup_table_id);
CREATE INDEX idx_lookup_versions_active ON public.lookup_table_versions(lookup_table_id, status) WHERE status = 'ACTIVE';
CREATE TRIGGER update_lookup_table_versions_updated_at BEFORE UPDATE ON public.lookup_table_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lookup_table_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.lookup_table_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.lookup_table_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LOOKUP 行データ
CREATE TABLE public.lookup_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.lookup_table_versions(id) ON DELETE CASCADE,
  conditions JSONB NOT NULL,
  return_value NUMERIC NOT NULL,
  return_value_max NUMERIC,
  interpolation public.interpolation_type DEFAULT 'CONSTANT',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lookup_rows_version ON public.lookup_rows(version_id);

ALTER TABLE public.lookup_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all" ON public.lookup_rows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write" ON public.lookup_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);
