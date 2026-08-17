# むく X月次ダッシュボード

自己完結型HTML。外部CDNなし。月次KPIと週次X記事提案を1ファイルで切り替える。

公開URL: リポジトリの GitHub Pages（main /）

## 更新の流れ

1. X Analytics のアカウント概要CSVを `Downloads` に置く（任意）
2. 週次JSONを `C:\Users\PC_User\Documents\Grok\muku_sns-weekly\YYYY-Www.json` に置く
3. 下のコマンドでHTMLを再生成する
4. このフォルダで `git add` → `commit` → `push`

```powershell
$NODE = "C:\Program Files\nodejs\node.exe"
$SKILL = "C:\Users\PC_User\.grok\skills\x-monthly-analytics-dashboard"
$CSV = "C:\Users\PC_User\Downloads\account_overview_analytics (1).csv"
$WEEKLY = "C:\Users\PC_User\Documents\Grok\muku_sns-weekly\2026-W34.json"
$OUT = "C:\Users\PC_User\Documents\Grok\muku-x-dashboard\index.html"

& $NODE "$SKILL\scripts\build_x_dashboard.mjs" `
  --csv $CSV `
  --existing $OUT `
  --output $OUT `
  --weekly $WEEKLY `
  --account-name "むく"

git -C "C:\Users\PC_User\Documents\Grok\muku-x-dashboard" add index.html
git -C "C:\Users\PC_User\Documents\Grok\muku-x-dashboard" commit -m "Update dashboard"
git -C "C:\Users\PC_User\Documents\Grok\muku-x-dashboard" push
```

CSVがなくても、既存HTMLの履歴は残る。新しい週次JSONだけ渡す場合も `--existing` と `--output` は同じ `index.html` にする。

## 画面

1. Overview
2. Monthly Trends
3. Weekday
4. Best / Worst
5. Weekly Articles
6. Rules & Data

週次タブは公開の閲覧・保存と、手元の週次JSONだけを使う。日別アカウント概要から記事テーマは断定しない。
