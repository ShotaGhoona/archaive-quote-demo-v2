# archaive-quote-demo-v2

## 再開メモ（2026-05-02 中断時点）

### 直近の作業
- ブランチ: `develop`（ワーキングツリーはクリーン、未コミット変更なし）
- 直近コミット: `ba906cd feat: 計算式ダイアログを電卓UIに一新し変数ラベルを表示`
- 流れ: その他マスタ配下の「計算式」をボタン構築UI化 → 葉ノードでカラム表示 → 電卓UIダイアログに一新、という順で進行中。

### 起動中のプロセス（中断時点のスナップショット）
- Vite 開発サーバーが二重起動していた:
  - PID 39130 → `:8081`
  - PID 42077 → `:8082`
  - ※ `npm run dev` は本来 `:8080` だが、別リポジトリ（cost-estimation-jam 系）の pgadmin が `:8080` を専有しているため自動フォールバックされた状態。
- ローカル Supabase: **未起動**（`npx supabase status` でコンテナなし）。
- 別リポジトリの Docker スタックが同時稼働中（このリポジトリとは無関係）:
  - `pgadmin_ai_solution :8080` / `postgres_container_ai_solution :5432` / `localstack_ai_solution :4566` / `cost-estimation-jam-frontend :3000` / `cost-estimation-jam-backend :8000`

### 再開時の手順
1. 古い vite が残っていれば落とす:
   ```bash
   pkill -f "archaive-quote-demo-v2/node_modules/.bin/vite"
   ```
2. `:8080` を空けたい場合は別リポジトリの pgadmin を停止（不要なら無視で可、Vite は 8081 にフォールバックする）:
   ```bash
   docker stop pgadmin_ai_solution
   ```
3. Supabase をローカルで使うなら起動（リモートのみで進めるなら不要）:
   ```bash
   npx supabase start
   ```
4. 開発サーバー起動:
   ```bash
   npm run dev
   ```

## コマンド

```bash
npm run dev        # 開発サーバー（port 8080）
npm run build      # プロダクションビルド
npm run build:dev  # 開発ビルド（ソースマップ付き）
npm run lint       # ESLint
npm run test       # テスト実行
npm run test:watch # テストウォッチモード
npm run preview    # ビルドプレビュー
```
