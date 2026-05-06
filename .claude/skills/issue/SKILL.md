---
name: issue
description: 説明文からGitHub Issueを作成する
allowed-tools: Bash(gh issue *), Bash(gh project *), Bash(gh api *)
---

ユーザーの説明文から適切なGitHub Issueを作成してください。

## プロジェクト情報

- リポジトリ: `ShotaGhoona/archaive-quote-demo-v2`
- プロジェクト番号: `2`（Archaive-Demo / オーナー: ShotaGhoona / ユーザーレベル）
- プロジェクトID: `PVT_kwHOC-n7rs4BWSXz`

## 手順

1. ユーザーの説明文を分析し、以下を判断する:
   - **種別（ラベルで管理）**: `type:feature` / `type:bug` / `type:task`
     - `type:feature`: 新機能追加
     - `type:bug`: 不具合修正
     - `type:task`: リファクタリング、ドキュメント、設定、QA等それ以外の作業
   - **対象領域（Area）**: Quote / Items / Master / Calc / UI / Schema（該当すれば）
   - **優先度（Priority）**: High / Medium / Low（明示されていなければ Medium）

2. Issueタイトルを作成する:
   - 短く具体的に（日本語）
   - 何をするかが一目でわかること

3. Issue本文を作成する:
   - `## やりたいこと` — ユーザーの意図を整理して書く
   - `## 背景` — なぜ必要か（説明文から読み取れれば）
   - `## 想定スコープ` — 対象ファイルや作業内容（わかる範囲で）
   - 不明な部分は無理に埋めない

4. プロジェクトのカスタムフィールド:
   - **Status**（Single select）: Todo / In Progress / Done
     - フィールドID: `PVTSSF_lAHOC-n7rs4BWSXzzhRn880`
     - オプションID: Todo=`f75ad846`, In Progress=`47fc9ee4`, Done=`98236657`
   - **Priority**（Single select）: High / Medium / Low
     - フィールドID: `PVTSSF_lAHOC-n7rs4BWSXzzhRn890`
     - オプションID: High=`4dc064ed`, Medium=`6b2cc104`, Low=`bbab1547`
   - **Area**（Single select）: Quote / Items / Master / Calc / UI / Schema
     - フィールドID: `PVTSSF_lAHOC-n7rs4BWSXzzhRn8-0`
     - オプションID: Quote=`c10ba964`, Items=`d25e38b3`, Master=`4b850495`, Calc=`81ef5374`, UI=`4a41baec`, Schema=`fc4e648e`

5. Milestoneを選択する（任意）:
   - `gh api repos/ShotaGhoona/archaive-quote-demo-v2/milestones --jq '.[].title'` で一覧を取得し、内容から最も適切なMilestoneを1つ選ぶ
   - Milestoneが未設定の場合はスキップしてよい

6. AskUserQuestion で確認する:
   - タイトル、Type（ラベル）、Area、Priority、Milestone、本文のプレビューを提示
   - OKなら作成、修正があれば反映

7. 確認後、**1回のBash呼び出し**で Issue作成 → Status=Todo設定 → Priority/Area設定をすべて実行する:
   - 以下のように `&&` チェーンで1コマンドにまとめる（Milestoneが無ければ `--milestone` フラグを省略）:
     ```bash
     ISSUE_URL=$(gh issue create --repo ShotaGhoona/archaive-quote-demo-v2 \
       --title "{タイトル}" \
       --label "{type:feature|type:bug|type:task}" \
       --assignee ShotaGhoona \
       --body "$(cat <<'BODY'
     {本文}
     BODY
     )") && \
     ITEM_ID=$(gh project item-add 2 --owner ShotaGhoona --url "$ISSUE_URL" --format json --jq '.id') && \
     gh project item-edit --project-id PVT_kwHOC-n7rs4BWSXz --id "$ITEM_ID" --field-id PVTSSF_lAHOC-n7rs4BWSXzzhRn880 --single-select-option-id f75ad846 && \
     gh project item-edit --project-id PVT_kwHOC-n7rs4BWSXz --id "$ITEM_ID" --field-id PVTSSF_lAHOC-n7rs4BWSXzzhRn890 --single-select-option-id {PriorityオプションID} && \
     gh project item-edit --project-id PVT_kwHOC-n7rs4BWSXz --id "$ITEM_ID" --field-id PVTSSF_lAHOC-n7rs4BWSXzzhRn8-0 --single-select-option-id {AreaオプションID} && \
     echo "$ISSUE_URL"
     ```
   - Areaが該当しない場合はAreaの `gh project item-edit` 行を省略する

8. 最後に出力されたIssueのURLを返す

## 注意

- 説明文が曖昧な場合は、わかる範囲で書いて「要件の詳細化が必要」と本文に記載する
- 1つの説明文に複数のIssueが含まれる場合は分割して作成する
- 関連するIssueがあれば本文で `#番号` で参照する
