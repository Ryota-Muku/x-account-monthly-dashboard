import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {importCSV} from '../analytics.mjs';
import {forAccount,checkedAccount} from '../accounts.mjs';
const csv = handle => `Date,Post id,Post URL,Impressions\n2026-11-20,2125210394184794577,https://x.com/${handle}/status/2125210394184794577,12`;
test('ownership validation and ID-only links use selected account',()=>{
 assert.equal(importCSV(csv('mukuax'),'mukuax').data[0].url,'https://x.com/mukuax/status/2125210394184794577');
 assert.throws(()=>importCSV(csv('mukuax')),/muku_sns/);
 assert.throws(()=>importCSV(csv('muku_sns'),'mukuax'),/mukuax/);
 assert.throws(()=>checkedAccount('../other'));
 assert.match(importCSV('Date,Post id,Impressions\n2026-11-20,2125210394184794577,12','mukuax').data[0].url,/mukuax/);
});
test('legacy history never appears in ax account',()=>{
 const reports=[{kind:'weekly',id:'old'},{kind:'weekly',account:'mukuax',id:'ax'},{kind:'monthly',account:'mukuax',id:'ax-month'}];
 assert.deepEqual(forAccount(reports,'muku_sns','weekly').map(x=>x.id),['old']);
 assert.deepEqual(forAccount(reports,'mukuax','weekly').map(x=>x.id),['ax']);
});
test('generator preserves old history, separates same-period accounts, and keeps missing days null',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'x-account-test-'));
 fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'reports'));
 for(const file of ['analytics.mjs','accounts.mjs','scripts/publish-report.mjs'])fs.copyFileSync(new URL('../'+file,import.meta.url),path.join(dir,file));
 fs.writeFileSync(path.join(dir,'reports/index.json'),JSON.stringify([{id:'weekly-2026-11-16',kind:'weekly',start:'2026-11-16'}]));
 fs.writeFileSync(path.join(dir,'reports/weekly-2026-11-16.json'),'legacy report unchanged');
 fs.writeFileSync(path.join(dir,'daily.csv'),'Date,Impressions\n2026-11-20,12');
 fs.writeFileSync(path.join(dir,'posts.csv'),csv('mukuax'));fs.writeFileSync(path.join(dir,'notes.json'),'[]');
 const args=[path.join(dir,'scripts/publish-report.mjs'),'weekly','2026-11-16','2026-11-22',path.join(dir,'daily.csv'),path.join(dir,'posts.csv'),path.join(dir,'notes.json'),'2026-11-25T02:00:00Z','mukuax'];
 execFileSync(process.execPath,args);execFileSync(process.execPath,args);
 const report=JSON.parse(fs.readFileSync(path.join(dir,'reports/mukuax-weekly-2026-11-16.json')));
 assert.equal(report.account,'mukuax');assert.equal(report.provisional,true);assert.equal(report.dailySeries[0].impressions,null);
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'reports/index.json'))).length,2);
 assert.equal(fs.readFileSync(path.join(dir,'reports/weekly-2026-11-16.json'),'utf8'),'legacy report unchanged');
});
