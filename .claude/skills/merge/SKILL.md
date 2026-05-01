---
name: merge
description: PRをマージし、関連IssueのプロジェクトステータスをDoneに変更する
allowed-tools: Bash(gh pr *), Bash(gh issue *), Bash(gh project *), Bash(gh api *), Bash(git checkout *), Bash(git pull *)
---

PR番号を受け取り、マージしてIssueのステータスを更新する。

## プロジェクト情報

- リポジトリ: `ShotaGhoona/archaive-quote-demo-v2`
- プロジェクト番号: `2`（Archaive-Demo / オーナー: ShotaGhoona）
- プロジェクトID: `PVT_kwHOC-n7rs4BWSXz`
- ベースブランチ: `develop`

## 引数

`$ARGUMENTS` にPR番号が渡される（例: `9`）

## 手順

1. **PRの情報を取得する**
   ```
   gh pr view {番号} --repo ShotaGhoona/archaive-quote-demo-v2 --json title,state,body,headRefName,baseRefName
   ```
   - PRがOpenであることを確認
   - 本文から `Closes #N` や `Fixes #N` で紐づくIssue番号を抽出

2. **PRをマージする**
   ```
   gh pr merge {番号} --repo ShotaGhoona/archaive-quote-demo-v2 --merge
   ```

3. **関連IssueのプロジェクトステータスをDoneに変更する**
   - プロジェクト番号: `2`
   - プロジェクトID: `PVT_kwHOC-n7rs4BWSXz`
   - StatusフィールドID: `PVTSSF_lAHOC-n7rs4BWSXzzhRn880`
   - DoneのオプションID: `98236657`

   ```
   # Issue番号からプロジェクトアイテムIDを取得
   gh project item-list 2 --owner ShotaGhoona --format json | python3 -c "
   import sys, json
   items = json.loads(sys.stdin.read())['items']
   for i in items:
       if i.get('content', {}).get('number') == {Issue番号}:
           print(i['id'])
           break
   "

   # ステータスをDoneに変更
   gh project item-edit \
     --project-id PVT_kwHOC-n7rs4BWSXz \
     --id {アイテムID} \
     --field-id PVTSSF_lAHOC-n7rs4BWSXzzhRn880 \
     --single-select-option-id 98236657
   ```

4. **ローカルブランチをdevelopに切り替える**
   ```
   git checkout develop
   git pull origin develop
   ```

5. **完了を報告する**
   - マージしたPRとステータス変更したIssueを簡潔に報告

## 注意

- PRがOpen以外の場合はマージしない
- 紐づくIssueが見つからない場合はマージのみ行い、その旨を報告する
- プロジェクトアイテムが見つからない場合もマージは実行し、ステータス変更のみスキップする
