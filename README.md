# むく X月次ダッシュボード

自己完結型HTML。外部CDNなし。月次KPIと週次X記事提案を1ファイルで切り替える。

公開URL: https://x-account-monthly-dashboard.vercel.app/

更新は `x-monthly-analytics-dashboard` スキルが HTML再生成 → この `index.html` へ反映 → `git push` まで行う。Vercelがpushをトリガーに自動デプロイする。

## 手動で更新する場合

1. X Analytics のアカウント概要CSVを `Downloads` に置く（任意）
2. 週次JSONを `C:\Users\PC_User\Documents\Grok\muku_sns-weekly\YYYY-Www.json` に置く
3. 下のコマンドでHTMLを再生成し、スキルの `sync_dashboard.mjs` で push する

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

& $NODE "$SKILL\scripts\sync_dashboard.mjs" --html $OUT
```

CSVがなくても、既存HTMLの履歴は残る。新しい週次JSONだけ渡す場合も `--existing` と `--output` は同じ `index.html` にする。

## 画面

1. Overview — フォロー転換コックピット
2. Market — 競合AI記事 vs 自垢の軸
3. Conversion — テーマ別の遷移と転換
4. Plan — 今週の記事7本と毎日のポスト
5. Trends — 月次・曜日・ベストワースト
6. Rules — 指標定義

日次CSVから記事テーマは断定しない。テーマ判定は投稿別CSVと公開記事だけを使う。
