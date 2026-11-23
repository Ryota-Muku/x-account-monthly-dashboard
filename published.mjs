import {esc,num,pct,er,change,lineChart,bars,donut,radar} from './charts.mjs';
import {matchedPeriod,analysisContent,competitorContent} from './report-content.mjs';
const $=id=>document.getElementById(id);let reports=[],generation=0;
async function show(){
 const token=++generation,id=$('reportHistory').value;
 if(!id){$('publishedBody').innerHTML='<p>月次は毎月1日に更新。まだレポートがありません。</p>';$('reportMeta').textContent='未作成';return;}
 try{
 const res=await fetch(`reports/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!res.ok)throw Error('fetch');const r=await res.json();if(token!==generation)return;
 const t=r.totals,prior=!r.provisional?r.previous?.totals:null;
 $('reportMeta').textContent=`${r.start} 〜 ${r.end} · ${r.provisional?(r.kind==='monthly'?'暫定（月途中・取得範囲まで）':'暫定（期間途中／未完備）'):'期間終了'} · ${r.days}/${r.expectedDays}日取得${r.calendarExpectedDays&&r.calendarExpectedDays!==r.expectedDays?`（月全体 ${r.calendarExpectedDays}日）`:''} · 取得 ${new Date(r.acquiredAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})} JST`;
 const delta=(a,b)=>{const v=change(a,b);return v==null?'比較なし':`${v>=0?'+':''}${v.toFixed(1)}%`};
 const erDelta=prior&&er(t)!=null&&er(prior)!=null?er(t)-er(prior):null;
 const summary=[`表示 ${num(t.impressions)}${prior?`（前期間比 ${delta(t.impressions,prior.impressions)}）`:''} · 反応率 ${pct(er(t))}${erDelta!=null?`（${erDelta>=0?'+':''}${erDelta.toFixed(2)}pt）`:''}`,r.provisional?(r.kind==='monthly'?'月途中のため、月全体の前月比は表示しません。下の同日数比較と分けて見ます。':'期間途中または未完備のため、前期間比は表示しません。'):'投稿ランキングは取得時点の累積値。日別活動や同条件の成績比較とは別です。',`次の一手：${r.nextAction||'上位投稿の型を再現し、保存とフォローで検証。'}`];
 $('publishedBody').innerHTML=`<div class="kpis">${[['表示',t.impressions,prior?.impressions],['保存',t.bookmarks,prior?.bookmarks],['新規フォロー',t.follows,prior?.follows],['純増',t.follows!=null&&t.unfollows!=null?t.follows-t.unfollows:null,prior&&prior.follows!=null&&prior.unfollows!=null?prior.follows-prior.unfollows:null]].map(([k,v,p])=>`<article class="kpi"><h3>${k}</h3><div class="value">${num(v)}</div><div class="delta">${delta(v,p)} <span>前期間比</span></div></article>`).join('')}</div>
 <div class="takeaways">${summary.map((s,i)=>`<p><span>${['結果','注意','行動'][i]}</span>${esc(s)}</p>`).join('')}</div>
 ${matchedPeriod(r)}<nav class="report-jumps" aria-label="レポート内移動"><a href="#report-analysis">考察・投稿提案 ↓</a><a href="#report-competitors">同期間の競合 ↓</a></nav><div class="chart-grid">
 <section class="chart-panel"><div class="chart-heading"><h3>日別の推移</h3><select id="lineMetric" aria-label="日別推移の指標"><option value="impressions">表示</option><option value="bookmarks">保存</option><option value="follows">フォロー</option></select></div><div id="lineChart"></div><p id="chartReadout" class="micro" aria-live="polite">点を選択すると実数を表示します。</p></section>
 <section class="chart-panel"><div class="chart-heading"><h3>成果を出した投稿</h3><select id="rankMetric" aria-label="投稿ランキングの指標"><option value="bookmarks">保存</option><option value="follows">フォロー</option><option value="impressions">表示</option></select></div><div id="rankChart"></div></section>
 <section class="chart-panel"><h3>反応の内訳</h3>${donut(t)}<p class="micro">4種類の反応件数の構成比。人数・総エンゲージメントとは別。</p></section>
 <section class="chart-panel"><h3>前期間と比べた伸び</h3>${radar(t,prior)}<p class="micro">${prior?`${esc(r.previous.start)} 〜 ${esc(r.previous.end)} と比較`:'比較データ不足、または対象期間が進行中'}</p></section>
 </div>
 <div id="report-analysis">${analysisContent(r)||'<p class="muted">この履歴には詳しい考察が未登録です。最新の月次レポートをご覧ください。</p>'}</div><div id="report-competitors">${competitorContent(r)||'<p class="muted">この履歴には競合調査が未登録です。</p>'}</div><details class="analysis-detail"><summary>詳しい分析・数値・集計条件</summary>${r.notes.map(n=>`<p>${esc(n)}</p>`).join('')}<p class="muted">日別 ${r.days}/${r.expectedDays}日。投稿別は取得時点の記載値（累積の場合あり）。日別と合算しません。</p><div class="table-wrap"><table><thead><tr><th>日付</th><th>表示</th><th>保存</th><th>新規フォロー</th></tr></thead><tbody>${(r.dailySeries||[]).map(d=>`<tr><th scope="row">${esc(d.date)}</th><td>${num(d.impressions)}</td><td>${num(d.bookmarks)}</td><td>${num(d.follows)}</td></tr>`).join('')}</tbody></table></div></details>`;
 const renderLine=()=>{$('lineChart').innerHTML=lineChart(r.dailySeries,$('lineMetric').value,$('lineMetric').selectedOptions[0].textContent);$('chartReadout').textContent='点を選択すると実数を表示します。';$('lineChart').querySelectorAll('circle').forEach(dot=>{for(const event of ['click','focus','pointerenter'])dot.addEventListener(event,()=>{$('chartReadout').textContent=dot.getAttribute('aria-label')});});};
 const renderRank=()=>{$('rankChart').innerHTML=bars(r.topPosts,$('rankMetric').value,$('rankMetric').selectedOptions[0].textContent)};
 $('lineMetric').addEventListener('change',renderLine);$('rankMetric').addEventListener('change',renderRank);renderLine();renderRank();
 }catch(e){if(token===generation)$('publishedBody').textContent='読み込みに失敗しました。再読み込みしてください。';}
}
function choose(preferred){const list=reports.filter(r=>r.kind===$('reportKind').value);$('reportHistory').innerHTML=list.map(r=>`<option value="${esc(r.id)}">${esc(r.start)} 〜 ${esc(r.end)}${r.provisional?'（暫定）':''}</option>`).join('');if(typeof preferred==='string'&&list.some(r=>r.id===preferred))$('reportHistory').value=preferred;const u=new URL(location.href);u.searchParams.set('kind',$('reportKind').value);if($('reportHistory').value)u.searchParams.set('report',$('reportHistory').value);history.replaceState(null,'',u);show();}
$('reportKind').addEventListener('change',()=>choose());$('reportHistory').addEventListener('change',()=>{const u=new URL(location.href);u.searchParams.set('report',$('reportHistory').value);history.replaceState(null,'',u);show();});
try{const res=await fetch('reports/index.json',{cache:'no-store'});if(!res.ok)throw Error('fetch');reports=await res.json();const q=new URLSearchParams(location.search);if(['weekly','monthly'].includes(q.get('kind')))$('reportKind').value=q.get('kind');choose(q.get('report'));}catch{$('publishedBody').textContent='公開レポートの読込に失敗しました。';}
