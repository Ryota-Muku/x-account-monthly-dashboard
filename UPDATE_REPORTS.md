# Scheduled report updates

Owner authorization: Discord channel 1563544720830103582, message 1563812006505750559 (2026-10-25): publish analysis to the existing website and update weekly/monthly.

- Weekly: Monday 09:00 Asia/Tokyo, previous Monday–Sunday; compare prior week only if fully covered.
- Monthly: first day 09:30 Asia/Tokyo, previous calendar month; compare preceding month only if fully covered.
- Site: https://x-account-monthly-dashboard.vercel.app/
- Repository: Ryota-Muku/x-account-monthly-dashboard (main auto-deploys via Vercel).
- Private downloads: /Users/openclaw/Documents/x-analytics-private/YYYY-MM-DD/. Never commit raw CSV, normalized rows, credentials or unrelated notes.

## Execution

1. Read browser-automation and social-csv-analytics skills. Inspect profiles and tabs; reuse only this task's tab. Confirm profile link `/muku_sns`. The managed `openclaw` profile was logged in on 2026-10-25; the `user` profile failed to attach, which does not mean X is logged out. Don't close other tasks' tabs.
2. Navigate Creator Studio -> Analytics. Export Overview (daily) and Content (post) CSVs for the required period and comparison. Use explicit dates or a sufficiently broad range; verify CSV minimum/maximum dates and coverage. Use 3M for monthly only if that UI option still exists. Latest exports had English weekday dates and Japanese headers. Download-save errors may coexist with a real file in `/tmp/openclaw/downloads`; verify existence, modification time and contents, never equate a click with success.
3. Save source files privately. If authentication, permissions, download or coverage fails, report the exact blocker to Discord; retain existing published report. Do not ask user for CSV until actually checking access. Do not invent missing values or mark incomplete data final.
4. Use the local parser in `analytics.mjs`. Analyze daily totals and post-level results separately; write a JSON array of concise Japanese findings/actions to a private notes file. Do not infer causes as facts. Post CSV values may be cumulative. Date-only exports retain their calendar dates; do not invent a timezone conversion. Don't send data to unapproved external AIs.
5. Fresh clone/fetch this repo in a durable workspace under `/Users/openclaw/Documents/projects/`. Preserve uncommitted work; use an isolated branch when needed. Read current instructions first. Run:
   `node scripts/publish-report.mjs weekly|monthly START END DAILY.csv POSTS.csv NOTES.json ACQUIRED_AT_ISO`
   The script writes only a summary and top five public-post references into `reports/`, and updates its manifest without deleting history. Acquisition timestamp must be the actual time of this export, not job start or an old file timestamp. Inspect output, days, expectedDays and provisional. Monthly stays separate from the legacy archive.
6. Test parser (`node --test tests/analytics.test.mjs`), JS syntax and report schema; verify HTML rendering with a browser. Stage only intended code/reports (no raw data). Commit/push, merge through normal repo permissions without bypassing failed checks. Publishing these report summaries is authorized by the user. Do not change access controls.
7. Verify the production report JSON and rendered page actually show the new period and timestamp. Don't claim success for a push alone. Notify Discord #42 (channel 1563544720830103582), mention 1048469507691266180, include URL, period, 2–3 findings and provisional/coverage caveats. On failure give exact blocker and keep the previous timestamp.

Scheduling is done via two enabled OpenClaw cron agent jobs, not GitHub Actions. Login/session expiry or host unavailability can prevent a future run; report run outcome honestly.
