-- ============================================
-- 初期データ（Seed）
-- ノードマスタ一本化アーキテクチャ
-- ============================================

-- ----------------------------------------------------------
-- 1. 単位
-- ----------------------------------------------------------
INSERT INTO public.units (code, name, dimension) VALUES
  ('mm',  'mm',  '長さ'),
  ('cm',  'cm',  '長さ'),
  ('m',   'm',   '長さ'),
  ('mm2', 'mm²', '面積'),
  ('mm3', 'mm³', '体積'),
  ('g',   'g',   '質量'),
  ('kg',  'kg',  '質量'),
  ('h',   '時間', '時間'),
  ('min', '分',  '時間'),
  ('個',  '個',  '個数'),
  ('式',  '式',  '個数'),
  ('円',  '円',  '金額')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------
-- 2. ノードマスタ（種類）
-- ----------------------------------------------------------
INSERT INTO public.node_masters (name, description, attribute_schema) VALUES
  ('材料項目', '材料の大分類（板金材、角材、丸材など）',
   '[{"key":"title","label":"タイトル","type":"STRING","required":true}]'),
  ('材料種別', '材料の具体的な種類（SS400、SUS304 等）',
   '[
     {"key":"title","label":"タイトル","type":"STRING","required":true},
     {"key":"category","label":"カテゴリ","type":"STRING","required":false},
     {"key":"density","label":"比重","type":"NUMBER","required":false},
     {"key":"unit_price","label":"基準単価(円/kg)","type":"NUMBER","required":false}
   ]'),
  ('計算ベース', '材料費の計算方法（重量ベース / 体積ベース 等）',
   '[{"key":"title","label":"タイトル","type":"STRING","required":true}]'),
  ('加工方法', '工程の大分類（フライス、旋盤、メッキ等）',
   '[{"key":"title","label":"タイトル","type":"STRING","required":true}]'),
  ('工程手法', '具体的な工程（NC旋盤、汎用旋盤、フライス機 等）',
   '[
     {"key":"title","label":"タイトル","type":"STRING","required":true},
     {"key":"hourly_rate","label":"時間単価(円/h)","type":"NUMBER","required":false},
     {"key":"setup_time","label":"標準段取り時間(h)","type":"NUMBER","required":false}
   ]'),
  ('表面処理手法', 'メッキ・塗装などの表面処理',
   '[
     {"key":"title","label":"タイトル","type":"STRING","required":true},
     {"key":"unit_cost","label":"基準単価(円/dm²)","type":"NUMBER","required":false}
   ]'),
  ('熱処理手法', '焼入れ・焼戻し・浸炭などの熱処理',
   '[
     {"key":"title","label":"タイトル","type":"STRING","required":true},
     {"key":"fixed_cost","label":"基準固定費(円)","type":"NUMBER","required":false}
   ]'),
  ('購入品種別', '購入品（ボルト、ベアリング等）の種別',
   '[
     {"key":"title","label":"タイトル","type":"STRING","required":true},
     {"key":"unit_price","label":"単価(円)","type":"NUMBER","required":false}
   ]'),
  ('諸経費種別', '諸経費の項目',
   '[{"key":"title","label":"タイトル","type":"STRING","required":true}]')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------
-- 3. ノードマスタ値
-- ----------------------------------------------------------

-- 材料項目
INSERT INTO public.node_master_values (node_master_id, values)
SELECT id, jsonb_build_object('title', t)
FROM public.node_masters m,
LATERAL (VALUES ('板金材'),('角材'),('丸材'),('角パイプ'),('鋼板'),('樹脂材')) AS x(t)
WHERE m.name = '材料項目';

-- 材料種別（比重・基準単価付き）
INSERT INTO public.node_master_values (node_master_id, values) VALUES
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"SS400","category":"鉄鋼","density":7.85,"unit_price":380}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"S45C","category":"鉄鋼","density":7.85,"unit_price":350}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"S50C","category":"鉄鋼","density":7.85,"unit_price":360}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"SK3","category":"工具鋼","density":7.85,"unit_price":520}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"SKS","category":"工具鋼","density":7.85,"unit_price":580}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"SUS304","category":"ステンレス","density":7.93,"unit_price":420}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"SUS316","category":"ステンレス","density":7.98,"unit_price":680}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"A2017","category":"アルミ","density":2.79,"unit_price":650}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"A5052","category":"アルミ","density":2.68,"unit_price":600}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"A7075","category":"アルミ","density":2.81,"unit_price":900}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"ABS","category":"樹脂","density":1.05,"unit_price":280}'),
  ((SELECT id FROM public.node_masters WHERE name='材料種別'),
    '{"title":"POM","category":"樹脂","density":1.41,"unit_price":420}');

-- 計算ベース
INSERT INTO public.node_master_values (node_master_id, values)
SELECT id, jsonb_build_object('title', t)
FROM public.node_masters m,
LATERAL (VALUES ('重量ベース'),('体積ベース'),('面積ベース')) AS x(t)
WHERE m.name = '計算ベース';

-- 加工方法
INSERT INTO public.node_master_values (node_master_id, values)
SELECT id, jsonb_build_object('title', t)
FROM public.node_masters m,
LATERAL (VALUES ('フライス'),('旋盤'),('研削'),('放電'),('表面処理'),('熱処理'),('組立')) AS x(t)
WHERE m.name = '加工方法';

-- 工程手法（hourly_rate, setup_time 付き）
INSERT INTO public.node_master_values (node_master_id, values) VALUES
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"NC旋盤","hourly_rate":6000,"setup_time":0.5}'),
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"汎用旋盤","hourly_rate":4500,"setup_time":0.3}'),
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"NCフライス","hourly_rate":7000,"setup_time":0.5}'),
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"汎用フライス","hourly_rate":5000,"setup_time":0.4}'),
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"マシニングセンタ","hourly_rate":8500,"setup_time":0.6}'),
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"ワイヤカット","hourly_rate":7500,"setup_time":0.5}'),
  ((SELECT id FROM public.node_masters WHERE name='工程手法'),
    '{"title":"研削盤","hourly_rate":6500,"setup_time":0.4}');

-- 表面処理手法
INSERT INTO public.node_master_values (node_master_id, values) VALUES
  ((SELECT id FROM public.node_masters WHERE name='表面処理手法'),
    '{"title":"三価クロムメッキ","unit_cost":120}'),
  ((SELECT id FROM public.node_masters WHERE name='表面処理手法'),
    '{"title":"無電解ニッケルメッキ","unit_cost":180}'),
  ((SELECT id FROM public.node_masters WHERE name='表面処理手法'),
    '{"title":"アルマイト","unit_cost":100}'),
  ((SELECT id FROM public.node_masters WHERE name='表面処理手法'),
    '{"title":"黒染め","unit_cost":80}'),
  ((SELECT id FROM public.node_masters WHERE name='表面処理手法'),
    '{"title":"塗装","unit_cost":150}');

-- 熱処理手法
INSERT INTO public.node_master_values (node_master_id, values) VALUES
  ((SELECT id FROM public.node_masters WHERE name='熱処理手法'),
    '{"title":"焼入れ","fixed_cost":500}'),
  ((SELECT id FROM public.node_masters WHERE name='熱処理手法'),
    '{"title":"焼戻し","fixed_cost":400}'),
  ((SELECT id FROM public.node_masters WHERE name='熱処理手法'),
    '{"title":"浸炭","fixed_cost":1200}'),
  ((SELECT id FROM public.node_masters WHERE name='熱処理手法'),
    '{"title":"窒化","fixed_cost":1500}');

-- 購入品種別
INSERT INTO public.node_master_values (node_master_id, values) VALUES
  ((SELECT id FROM public.node_masters WHERE name='購入品種別'),
    '{"title":"ボルト・ナット","unit_price":50}'),
  ((SELECT id FROM public.node_masters WHERE name='購入品種別'),
    '{"title":"ベアリング","unit_price":1500}'),
  ((SELECT id FROM public.node_masters WHERE name='購入品種別'),
    '{"title":"オイルシール","unit_price":300}'),
  ((SELECT id FROM public.node_masters WHERE name='購入品種別'),
    '{"title":"スプリング","unit_price":200}');

-- 諸経費種別
INSERT INTO public.node_master_values (node_master_id, values)
SELECT id, jsonb_build_object('title', t)
FROM public.node_masters m,
LATERAL (VALUES ('運賃'),('梱包費'),('検査費'),('図面作成費'),('特別経費')) AS x(t)
WHERE m.name = '諸経費種別';

-- ----------------------------------------------------------
-- 4. 取引先
-- ----------------------------------------------------------
INSERT INTO public.customers (name, name_kana, customer_type, rank, attributes) VALUES
  ('★★製作所',         'ホシホシセイサクショ',         'CUSTOMER', 'B', '{"phone":"03-1111-2222"}'),
  ('◯◯工業',           'マルマルコウギョウ',            'CUSTOMER', 'A', '{"phone":"03-3333-4444"}'),
  ('△△精密',           'サンカクサンカクセイミツ',      'CUSTOMER', 'A', '{"phone":"03-5555-1111"}'),
  ('◇◇技研',           'シカクシカクギケン',            'CUSTOMER', 'C', '{"phone":"03-2222-3333"}'),
  ('◯◯メッキ工業',     'マルマルメッキコウギョウ',      'SUPPLIER', 'A', '{"phone":"03-5555-6666"}'),
  ('△△鉱業',           'サンカクサンカクコウギョウ',    'SUPPLIER', 'B', '{"phone":"03-7777-8888"}'),
  ('熱処理センター',     'ネツショリセンター',            'SUPPLIER', 'A', '{"phone":"03-9999-0000"}'),
  ('運送◯◯',           'ウンソウマルマル',              'SUPPLIER', 'B', '{"phone":"03-4444-5555"}');

-- ----------------------------------------------------------
-- 5. 変数定義
--    PATH 変数は path_key で経路上ノードの values JSON のキーを指定
-- ----------------------------------------------------------
INSERT INTO public.variable_definitions (code, label, type, unit_id, required, source, path_key, default_value, description) VALUES
  -- 手入力（図面から読み取る）
  ('d',           '直径',         'NUMBER', (SELECT id FROM public.units WHERE code='mm'),  true,  'MANUAL', NULL,           NULL, '材料の直径'),
  ('L',           '長さ',         'NUMBER', (SELECT id FROM public.units WHERE code='mm'),  true,  'MANUAL', NULL,           NULL, '材料の長さ'),
  ('W',           '幅',           'NUMBER', (SELECT id FROM public.units WHERE code='mm'),  true,  'MANUAL', NULL,           NULL, '材料の幅'),
  ('H',           '高さ',         'NUMBER', (SELECT id FROM public.units WHERE code='mm'),  true,  'MANUAL', NULL,           NULL, '材料の高さ'),
  ('thickness',   '板厚',         'NUMBER', (SELECT id FROM public.units WHERE code='mm'),  true,  'MANUAL', NULL,           NULL, '板の厚さ'),
  ('t',           '加工時間',     'NUMBER', (SELECT id FROM public.units WHERE code='h'),   true,  'MANUAL', NULL,           NULL, '加工に要する時間'),
  ('q',           '数量',         'NUMBER', (SELECT id FROM public.units WHERE code='個'),  true,  'MANUAL', NULL,           NULL, 'ロット数量'),
  ('area',        '面積',         'NUMBER', (SELECT id FROM public.units WHERE code='mm2'), true,  'MANUAL', NULL,           NULL, '加工面積（dm²換算で使うときは / 10000）'),
  ('金額',        '金額',         'NUMBER', (SELECT id FROM public.units WHERE code='円'),  true,  'MANUAL', NULL,           NULL, '直接入力する金額'),
  ('transport',   '運賃',         'NUMBER', (SELECT id FROM public.units WHERE code='円'),  false, 'MANUAL', NULL,           NULL, '外注運賃'),
  -- パス（経路上のノードマスタ値から取得）
  ('rho',         '比重',         'NUMBER', NULL,                                            true,  'PATH',   'density',      NULL, '材料種別の比重'),
  ('P',           '基準単価',     'NUMBER', (SELECT id FROM public.units WHERE code='円'),  true,  'PATH',   'unit_price',   NULL, '材料/購入品の基準単価'),
  ('hourly_rate', '時間単価',     'NUMBER', (SELECT id FROM public.units WHERE code='円'),  true,  'PATH',   'hourly_rate',  NULL, '工程手法の時間単価'),
  ('setup_time',  '段取り時間',   'NUMBER', (SELECT id FROM public.units WHERE code='h'),   false, 'PATH',   'setup_time',   NULL, '工程手法の標準段取り時間'),
  ('UC',          '処理単価',     'NUMBER', (SELECT id FROM public.units WHERE code='円'),  true,  'PATH',   'unit_cost',    NULL, '表面処理単価(円/dm²)'),
  ('FC',          '固定費',       'NUMBER', (SELECT id FROM public.units WHERE code='円'),  true,  'PATH',   'fixed_cost',   NULL, '熱処理の固定費'),
  -- LOOKUP
  ('Y',           '歩留まり',     'NUMBER', NULL,                                            true,  'LOOKUP', NULL,           NULL, '歩留まり係数（LOOKUP）')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------
-- 6. LOOKUP テーブル: 歩留まり表
-- ----------------------------------------------------------
INSERT INTO public.lookup_tables (name, description, axes) VALUES (
  '歩留まり表',
  '材料種別と直径から歩留まり係数を引く',
  '[
    {"variable_code":"material_title","match_type":"EXACT","axis_order":1},
    {"variable_code":"d","match_type":"RANGE","axis_order":2}
  ]'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.lookup_table_versions (lookup_table_id, version_number, status, description)
SELECT id, 1, 'ACTIVE', '初版' FROM public.lookup_tables WHERE name = '歩留まり表'
ON CONFLICT (lookup_table_id, version_number) DO NOTHING;

WITH version AS (
  SELECT v.id FROM public.lookup_table_versions v
  JOIN public.lookup_tables t ON v.lookup_table_id = t.id
  WHERE t.name = '歩留まり表' AND v.status = 'ACTIVE'
)
INSERT INTO public.lookup_rows (version_id, conditions, return_value, return_value_max, interpolation) VALUES
  ((SELECT id FROM version), '{"material_title":"SS400",  "d_min":0,  "d_max":30}',  1.05, NULL, 'CONSTANT'),
  ((SELECT id FROM version), '{"material_title":"SS400",  "d_min":30, "d_max":60}',  1.10, 1.20, 'LINEAR'),
  ((SELECT id FROM version), '{"material_title":"SS400",  "d_min":60, "d_max":100}', 1.20, NULL, 'CONSTANT'),
  ((SELECT id FROM version), '{"material_title":"SUS304", "d_min":0,  "d_max":30}',  1.05, NULL, 'CONSTANT'),
  ((SELECT id FROM version), '{"material_title":"SUS304", "d_min":30, "d_max":60}',  1.10, NULL, 'CONSTANT'),
  ((SELECT id FROM version), '{"material_title":"A5052",  "d_min":0,  "d_max":30}',  1.03, NULL, 'CONSTANT'),
  ((SELECT id FROM version), '{"material_title":"A5052",  "d_min":30, "d_max":60}',  1.07, NULL, 'CONSTANT');

-- ----------------------------------------------------------
-- 7. LOOKUP テーブル: 全体利益率表
-- ----------------------------------------------------------
INSERT INTO public.lookup_tables (name, description, axes) VALUES (
  '全体利益率表',
  '原価合計から全体の利益率を引く（金額帯で段階的）',
  '[{"variable_code":"cost_total","match_type":"RANGE","axis_order":1}]'
) ON CONFLICT (name) DO NOTHING;

INSERT INTO public.lookup_table_versions (lookup_table_id, version_number, status, description)
SELECT id, 1, 'ACTIVE', '初版' FROM public.lookup_tables WHERE name = '全体利益率表'
ON CONFLICT (lookup_table_id, version_number) DO NOTHING;

WITH version AS (
  SELECT v.id FROM public.lookup_table_versions v
  JOIN public.lookup_tables t ON v.lookup_table_id = t.id
  WHERE t.name = '全体利益率表' AND v.status = 'ACTIVE'
)
INSERT INTO public.lookup_rows (version_id, conditions, return_value, return_value_max, interpolation) VALUES
  ((SELECT id FROM version), '{"cost_total_min":0,      "cost_total_max":50000}',    0.30, NULL, 'CONSTANT'),
  ((SELECT id FROM version), '{"cost_total_min":50000,  "cost_total_max":500000}',   0.25, 0.15, 'LINEAR'),
  ((SELECT id FROM version), '{"cost_total_min":500000, "cost_total_max":99999999}', 0.10, NULL, 'CONSTANT');

-- ----------------------------------------------------------
-- 8. 計算式テンプレート (F)
-- ----------------------------------------------------------
INSERT INTO public.formula_templates (name, kind, category, formula, description, variables) VALUES
  ('丸棒材料費（重量ベース）', 'F', 'MATERIAL',
    '(d/2)^2 * PI * L * rho/1000000 * P * Y',
    '丸棒の材料費を重量ベースで計算。d=直径(mm), L=長さ(mm), rho=比重, P=単価(円/kg), Y=歩留まり',
    '[{"code":"d"},{"code":"L"},{"code":"rho"},{"code":"P"},{"code":"Y"}]'),
  ('板材材料費（重量ベース）', 'F', 'MATERIAL',
    'W * H * thickness * rho/1000000 * P',
    '板材の材料費を重量ベースで計算。W=幅, H=高さ, thickness=板厚',
    '[{"code":"W"},{"code":"H"},{"code":"thickness"},{"code":"rho"},{"code":"P"}]'),
  ('角材材料費', 'F', 'MATERIAL',
    'W * H * L * rho/1000000 * P',
    '角材の材料費。W*H*L で体積、比重と単価で重量単価へ',
    '[{"code":"W"},{"code":"H"},{"code":"L"},{"code":"rho"},{"code":"P"}]'),
  ('工程費（時間ベース）', 'F', 'IN_HOUSE',
    '(t + setup_time) * hourly_rate',
    '加工時間+段取り時間に時間単価を掛ける',
    '[{"code":"t"},{"code":"setup_time"},{"code":"hourly_rate"}]'),
  ('工程費（時間のみ）', 'F', 'IN_HOUSE',
    't * hourly_rate',
    '加工時間 × 時間単価（段取り省略版）',
    '[{"code":"t"},{"code":"hourly_rate"}]'),
  ('表面処理費（面積ベース）', 'F', 'OUTSOURCE',
    'area / 10000 * UC',
    '面積(mm²) を dm² に換算し処理単価を掛ける',
    '[{"code":"area"},{"code":"UC"}]'),
  ('熱処理費（固定）', 'F', 'OUTSOURCE',
    'FC * q',
    '熱処理の固定費 × 数量',
    '[{"code":"FC"},{"code":"q"}]'),
  ('購入品（単価×数量）', 'F', 'PURCHASE',
    'P * q',
    '購入品の単価 × 数量',
    '[{"code":"P"},{"code":"q"}]'),
  ('諸経費（金額直接入力）', 'F', 'EXPENSE',
    '金額',
    '入力された金額をそのまま採用',
    '[{"code":"金額"}]');

-- G テンプレート（ビルトイン）
INSERT INTO public.formula_templates (name, kind, formula, is_builtin, builtin_key, description) VALUES
  ('G_pass',      'G', 'SUM(小計)',                         true, 'G_pass',      '小計をそのまま合計'),
  ('G_outsource', 'G', 'SUM(小計) + SUM(運賃)',             true, 'G_outsource', '外注費の運賃加算'),
  ('G_margin',    'G', 'SUM(小計) * (1 + category_margin)', true, 'G_margin',    'カテゴリ別利益率を掛ける');

-- H テンプレート（ビルトイン）
INSERT INTO public.formula_templates (name, kind, formula, is_builtin, builtin_key, description) VALUES
  ('H_pass',     'H', 'SUM(中計)',                                       true, 'H_pass',     'カテゴリ別利益率モード'),
  ('H_overall',  'H', 'SUM(中計) * (1 + total_margin)',                  true, 'H_overall',  '全体一括利益率モード'),
  ('H_lookup',   'H', 'SUM(中計) * (1 + LOOKUP("利益率表", SUM(中計)))', true, 'H_lookup',   'LOOKUP 利益率モード');

-- ----------------------------------------------------------
-- 9. 会社設定（シングルトン）
-- ----------------------------------------------------------
INSERT INTO public.quote_formula_settings (
  margin_mode, total_margin, rounding_method, rounding_digits,
  category_margins, enabled_categories
) VALUES (
  'CATEGORY',
  0,
  'ROUND',
  -2,
  '{"MATERIAL":0.10,"IN_HOUSE":0.30,"OUTSOURCE":0.20,"PURCHASE":0.05,"EXPENSE":0}',
  '["MATERIAL","IN_HOUSE","OUTSOURCE","PURCHASE","EXPENSE"]'
);

-- ----------------------------------------------------------
-- 10. サンプル Item
-- ----------------------------------------------------------
INSERT INTO public.items (item_code, name, customer_id, drawing_url, remarks) VALUES
  ('ABC-001', 'シャフト A-100',
    (SELECT id FROM public.customers WHERE name='★★製作所'),
    NULL,
    'SUS304 丸棒 φ50×200mm、旋盤加工＋焼入れ'),
  ('ABC-002', 'フランジ B-50',
    (SELECT id FROM public.customers WHERE name='◯◯工業'),
    NULL,
    'SS400 板厚 10mm、フライス加工'),
  ('ABC-003', 'ブラケット C-200',
    (SELECT id FROM public.customers WHERE name='△△精密'),
    NULL,
    'A5052 角材 50×30×100、フライス加工＋アルマイト'),
  ('ABC-004', 'スペーサ D-30',
    (SELECT id FROM public.customers WHERE name='◇◇技研'),
    NULL,
    'POM 丸棒 φ20×30mm、旋盤加工')
ON CONFLICT (item_code) DO NOTHING;
