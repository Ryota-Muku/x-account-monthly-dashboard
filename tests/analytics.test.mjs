import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,importCSV,mergeRows,summarize,monday,shift,dateValue,rate} from '../analytics.mjs';
test('BOM, CRLF, quoted commas, newlines, escaped quotes',()=>{
  const p=parseCSV('\uFEFFa,b\r\n"hello,\nworld","""quoted"""\r\n');
  assert.deepEqual(p.rows,[['hello,\nworld','"quoted"']]);
  assert.throws(()=>parseCSV('a,b\n"broken,2'));
  assert.throws(()=>parseCSV('a,b\n1,2,3'));
});
test('Japanese daily export, missing metric stays unknown',()=>{
  const x=importCSV('Date,インプレッション数,いいね,新しいフォロー\n2026-10-19,"1,200",3,0');
  assert.equal(x.type,'daily');assert.equal(x.data[0].impressions,1200);
  assert.equal(x.data[0].follows,0);assert.equal(x.data[0].bookmarks,null);
});
test('English post export preserves long IDs, JST dates and body',()=>{
  const x=importCSV('Post id,Post text,Time,Impressions,Engagements\n1987654321234567890,"hi,\nthere",2026-10-18 18:30 +0000,100,10');
  assert.equal(x.type,'post');assert.equal(x.data[0].key,'1987654321234567890');
  assert.equal(x.data[0].date,'2026-10-19');assert.equal(x.data[0].text,'hi,\nthere');
  assert.equal(rate(10,100),0.1);assert.equal(rate(1,0),null);
});
test('Reject wrong account URLs and unknown columns without silent skipping',()=>{
  assert.throws(()=>importCSV('Date,Post link,Impressions\n2026-10-19,https://x.com/other/status/123,30'));
  assert.throws(()=>importCSV('Date,Post link,Impressions\n2026-10-19,javascript:alert(1),30'));
  assert.throws(()=>importCSV('Date,Other\n2026-10-19,1'));
  assert.throws(()=>importCSV('Date,Impressions\nnot-date,1'));
  assert.throws(()=>importCSV('Date,Impressions\n2026-10-19,nope'));
});
test('ISO year boundaries and leap days',()=>{
  assert.equal(monday('2027-01-01'),'2026-12-28');assert.equal(monday('2026-10-19'),'2026-10-19');
  assert.equal(monday('2026-10-25'),'2026-10-19');assert.equal(shift('2024-02-28',1),'2024-02-29');
  assert.equal(dateValue('2026-02-30'),null);assert.equal(dateValue('2026/10/9'),'2026-10-09');
});
test('Deduplication, inclusive 7 day window, missing days and weighted rates',()=>{
  const first=importCSV('Date,Impressions,Engagements\n2026-10-18,99,9\n2026-10-19,100,10\n2026-10-25,900,9\n2026-10-26,500,50');
  const later=importCSV('Date,Impressions,Engagements\n2026-10-19,200,20');
  const merged=mergeRows(first.data,later.data);assert.equal(merged.length,4);
  const summary=summarize(merged,'2026-10-19');assert.equal(summary.days,2);
  assert.equal(summary.totals.impressions,1100);assert.equal(summary.totals.engagements,29);
  assert.equal(rate(summary.totals.engagements,summary.totals.impressions),29/1100);
  assert.equal(summary.totals.likes,null);assert.equal(summarize([], '2026-10-19').totals.impressions,null);
});
