-- ============================================
-- ENUM 型の定義
-- ============================================

-- 見積カテゴリ
CREATE TYPE public.quote_category AS ENUM ('MATERIAL', 'IN_HOUSE', 'OUTSOURCE', 'PURCHASE', 'EXPENSE');

-- 計算式テンプレートの種別
CREATE TYPE public.formula_kind AS ENUM ('F', 'G', 'H');

-- LOOKUP の軸マッチ方式
CREATE TYPE public.lookup_match_type AS ENUM ('EXACT', 'RANGE', 'PREFIX');

-- LOOKUP の補間種別
CREATE TYPE public.interpolation_type AS ENUM ('CONSTANT', 'LINEAR');

-- 変数の型
CREATE TYPE public.variable_type AS ENUM ('NUMBER', 'STRING', 'BOOLEAN', 'SELECT');

-- 変数のソース（MANUAL: 手入力, LOOKUP: ルックアップ, PATH: 選択肢の木の経路から）
CREATE TYPE public.variable_source AS ENUM ('MANUAL', 'LOOKUP', 'PATH');

-- LOOKUP バージョンの状態
CREATE TYPE public.lookup_version_status AS ENUM ('ACTIVE', 'ARCHIVED');

-- 利益率モード
CREATE TYPE public.margin_mode AS ENUM ('CATEGORY', 'TOTAL', 'LOOKUP');

-- 丸め方式
CREATE TYPE public.rounding_method AS ENUM ('FLOOR', 'CEIL', 'ROUND');
