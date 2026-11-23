import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisContent,competitorContent,matchedPeriod} from '../report-content.mjs';
test('editorial text is escaped and non-X links are never navigable',()=>{
 const s=analysisContent({insights:{observations:[{title:'<img onerror=x>',detail:'<script>alert(1)</script>',sources:['javascript:alert(1)','https://x.com/example/status/123']}],hypotheses:[],experiments:[]}});
 assert.ok(!s.includes('<script>'));assert.ok(!s.includes('href="javascript:'));assert.ok(s.includes('&lt;img'));assert.ok(s.includes('https://x.com/example/status/123'));
});
test('unknown competitor counts are not shown as zero; evidence time stays with the card',()=>{
 const s=competitorContent({competitorResearch:{observedAt:'2026-11-23T03:00:00Z',examples:[{author:'test',url:'https://x.com/test/status/123',date:'2026-11-20',title:'test',summary:'test',views:null,likes:0,bookmarks:null,observedAt:'2026-11-23T03:00:00Z'}]}});
 assert.ok(s.includes('表示 —'));assert.ok(s.includes('いいね 0'));assert.ok(s.includes('保存 —'));assert.ok(s.includes('指標確認'));assert.ok(s.includes('アカウント全体'));
});
test('equal-day comparison is distinct from full previous-month change',()=>{
 const s=matchedPeriod({start:'2026-11-01',end:'2026-11-22',totals:{impressions:120,bookmarks:50,follows:5},matchedComparison:{start:'2026-10-01',end:'2026-10-22',days:22,totals:{impressions:100,bookmarks:0,follows:null}}});
 assert.match(s,/各22日/);assert.match(s,/\+20.0%/);assert.match(s,/比較なし/);assert.match(s,/月全体の前月比ではなく/);
});
