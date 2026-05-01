-- ============================================
-- カテゴリごとに使う G テンプレート（中計の計算式）の選択を保存
-- 例: {"MATERIAL": "<G_margin uuid>", "IN_HOUSE": "<G_pass uuid>"}
-- ============================================

ALTER TABLE public.quote_formula_settings
  ADD COLUMN category_g_templates JSONB DEFAULT '{}';
