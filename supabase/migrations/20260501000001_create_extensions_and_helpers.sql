-- ============================================
-- 共通: updated_at 自動更新トリガー関数
-- 全テーブル共通で使用する
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
