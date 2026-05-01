# Archaive-Quote v2 デモ作成必要資料

`poc-template`（Lovable 互換: Vite + React + Supabase + shadcn/ui）をクローンして、claude-code に Archaive-Quote v2 のデモを作らせるための **ビジネス要件・DB 構造・UI 仕様** をまとめた資料。

## このフォルダの位置づけ

技術スタック・ライブラリ選定・ファイル構成といった「作り方」は **poc-template の `CLAUDE.md` と `docs/plan/` が既に持っている** ので、ここでは扱わない。

このフォルダは **「何を作るか」** に絞る:

- 製品概要（ビジネス要件）
- 用語と概念モデル
- ユースケース
- 画面仕様（ASCII モックアップ付き）
- DB 設計（Supabase マイグレーションそのまま使える SQL）
- 計算ロジック
- モーダル仕様
- 初期データ
- 実装フェーズ

## ドキュメント構成

| ファイル | 内容 | 主な対象 |
|---|---|---|
| [00-製品概要.md](./00-製品概要.md) | 何を作るか・誰のためか・スコープ | 全員（最初に読む） |
| [01-用語と概念モデル.md](./01-用語と概念モデル.md) | 合計／中計／小計、F/G/H、統一パターン、上書き 3 レバー | 全員 |
| [02-ユースケース.md](./02-ユースケース.md) | ペルソナ × 業務シナリオ | PM・実装者 |
| [03-画面仕様.md](./03-画面仕様.md) | 全画面の ASCII モックアップ＋振る舞い | 実装者 |
| [04-DB設計.md](./04-DB設計.md) | Supabase 用マイグレーション SQL（RLS 含む） | 実装者 |
| [05-計算ロジック.md](./05-計算ロジック.md) | F/G/H・LOOKUP・補間・上書きの厳密定義 | 実装者 |
| [06-モーダル仕様.md](./06-モーダル仕様.md) | 全モーダルの仕様 | 実装者 |
| [07-初期データ.md](./07-初期データ.md) | seed 用 SQL（マスタ・サンプル Item） | 実装者 |
| [08-実装フェーズ.md](./08-実装フェーズ.md) | Phase A〜F に分割した実装順序＋完成定義 | 実装者 |

## 使い方（claude-code に振るとき）

1. **poc-template を新しい場所にクローン**
2. **このフォルダの 00 〜 08 を `docs/` 配下に丸ごとコピー**（or リンク）
3. claude-code に次のように指示:

   ```
   docs/00-製品概要.md から 08-実装フェーズ.md までを順に読み、
   Phase A から実装を始めてください。
   poc-template の CLAUDE.md と docs/plan/loverbleでの実装方式.md を
   実装パターンの参考にしてください。
   ```

4. Phase ごとに動作確認しながら進める

## 技術スタック前提（poc-template のもの）

| 領域 | 技術 |
|---|---|
| Frontend | Vite + React 18 + TypeScript + Tailwind + shadcn/ui |
| Backend | Supabase（PostgreSQL + Auth + Storage） |
| サーバーステート | TanStack React Query |
| フォーム | react-hook-form + Zod |
| ルーティング | React Router v6 |
| トースト | sonner |

→ **このフォルダの仕様は上記スタックで実装される前提** で書かれている。SQL は PostgreSQL（Supabase）方言、フロントは Lovable 互換パターン。

## 関連ドキュメント

- 上位の要件定義: [../v2-要件定義/](../v2-要件定義/) — モデルと用語の議論
- 既存デモ分析: [../demo-0423/](../demo-0423/) — quotation-demo の参考
- poc-template: `/Users/yamashitashota/Doc/ghoona/starup/dev/loveble/poc-template`

## 更新履歴

- 2026-05-01: 初版。v2-要件定義 を Lovable 互換のデモ作成資料に展開。
