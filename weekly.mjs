import { importCSV, mergeRows, summarize, rate, shift, monday } from './analytics.mjs';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = n => n === null ? '—' : n.toLocaleString('ja-JP', {maximumFractionDigits: 1});
const pct = n => n === null ? '—' : `${(n * 100).toFixed(2)}%`;
let datasets = {daily: [], post: []};
let report = null;
$('start').value = monday(new Date(Date.now() + 9 * 3600000).toISOString().slice(0,10));
$('accountConfirm').addEventListener('change', () => { $('csvInput').disabled = !$('accountConfirm').checked; });
$('csvInput').addEventListener('change', async event => {
  const files = [...event.target.files];
  if (!files.length) return;
  $('csvInput').disabled = true;
  try {
    // Transactional import: one bad file never leaves a half-imported batch.
    const incoming = [];
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) throw Error('CSVは1ファイル20MBまでです。期間を分けてください。');
      incoming.push({...importCSV(await file.text()), name: file.name});
    }
    const next = {...datasets};
    for (const item of incoming) next[item.type] = mergeRows(next[item.type], item.data);
    datasets = next;
    const selected = incoming.some(i => i.type === 'daily') ? 'daily' : 'post';
    $('source').value = selected;
    $('start').value = monday(datasets[selected].at(-1).date);
    $('status').className = '';
    $('status').textContent = `取込完了: ${incoming.map(i => `${i.name} (${i.data.length}行)`).join(' / ')}\n保持中: 日別 ${datasets.daily.length}日 / 投稿別 ${datasets.post.length}件。重複は上書き済み。`;
    render();
  } catch (error) { $('status').className = 'error'; $('status').textContent = `取込できませんでした（既存データは維持）: ${error.message}`; }
  finally { event.target.value = ''; $('csvInput').disabled = !$('accountConfirm').checked; }
});
function render() {
  const start = $('start').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) { $('export').disabled = true; return; }
  const type = $('source').value;
  const rows = datasets[type];
  const current = summarize(rows, start), previous = summarize(rows, shift(start, -7));
  const t = current.totals, p = previous.totals;
  const comparable = type === 'daily' && current.days === 7 && previous.days === 7;
  const er = rate(t.engagements, t.impressions);
  $('period').textContent = `${start} — ${current.end}`;
  $('coverage').textContent = type === 'daily' ? `${current.days} / 7日分${current.days < 7 ? ' · 未完備' : ''}` : `${current.rows.length}投稿 · 累積値の可能性あり`;
  $('context').textContent = (type === 'daily' ? '日別CSVに記録された期間実績。' : 'この7日間に投稿されたポストのCSV記載値。期間内に発生した反応だけとは限りません。') + (rows.length ? ` 取込範囲: ${rows[0].date} 〜 ${rows.at(-1).date}。` : ' CSVを取り込むと表示されます。') + (comparable ? ` 比較: ${shift(start,-7)} 〜 ${shift(start,-1)}。` : ' 前週比: 比較条件を満たしていないため非表示。');
  const cards = [['インプレッション',t.impressions,p.impressions],['エンゲージメント率',er,rate(p.engagements,p.impressions),'rate'],['ブックマーク',t.bookmarks,p.bookmarks],['新しいフォロー',t.follows,p.follows],['プロフィールアクセス',t.profile,p.profile],['いいね',t.likes,p.likes],['リポスト',t.reposts,p.reposts],['投稿数',type==='post'?current.rows.length:t.posts,p.posts]];
  $('kpis').innerHTML = cards.map(([label,value,old,kind]) => {
    let delta = '前週比 —';
    if (comparable && value !== null && old !== null) {
      delta = kind === 'rate' ? `前週差 ${((value-old)*100).toFixed(2)} pt` : old > 0 ? `前週比 ${value >= old ? '+' : ''}${((value-old)/old*100).toFixed(1)}%` : `前週 0 → ${num(value)}`;
    }
    return `<article class="kpi"><h3>${label}</h3><div class="value">${kind==='rate'?pct(value):num(value)}</div><div class="delta">${delta}</div></article>`;
  }).join('');
  const insights = [];
  if (!current.rows.length) insights.push('この期間のデータはありません。CSVを取り込むか、集計開始日を変更してください。');
  else {
    if (type === 'daily' && !comparable) insights.push('まず今回と前週の14日分を揃える。欠けた日を0として扱わず、比較できる状態にするのが次の一手です。');
    if (comparable && t.impressions !== null && p.impressions !== null) {
      insights.push(t.impressions > p.impressions ? '到達は前週より増加。投稿別CSVで、どのポストが増加に寄与したか確認しましょう。' : '到達は前週以下。投稿本数の差と1本あたりの反応を分けて確認しましょう。');
    }
    if (type === 'daily') insights.push('内容の改善には投稿別CSVも必要です。日別合計だけでテーマの勝敗や原因は判断しません。');
    else {
      const ranked = [...current.rows].filter(r=>r.impressions>0).sort((a,b)=>b.impressions-a.impressions);
      if (ranked.length) insights.push(`最多到達の投稿は ${ranked[0].date}、${num(ranked[0].impressions)} インプレッション。本文と保存・フォローを合わせて確認し、再現したい要素を1つ選びましょう。`);
      insights.push('投稿日が古いほど累積値が大きくなりやすいため、ランキングだけで優劣を断定しないでください。');
    }
    if (t.follows === null) insights.push('フォローの列が未提供または空欄です。フォロー獲得は推定せず、確認可能な指標で振り返ります。');
  }
  $('insights').innerHTML = insights.map(s=>`<p>${esc(s)}</p>`).join('');
  $('tableTitle').textContent = type === 'daily' ? '日別の実績' : '投稿ランキング';
  $('sort').disabled = type === 'daily';
  const sortKey = $('sort').value;
  const score = r => sortKey==='er'?rate(r.engagements,r.impressions):r[sortKey];
  const tableRows = type === 'daily' ? Array.from({length:7},(_,i)=>current.rows.find(r=>r.date===shift(start,i)) || {date:shift(start,i),missing:true}) : [...current.rows].sort((a,b)=>(score(b)??-1)-(score(a)??-1));
  $('thead').innerHTML = '<tr>'+[type==='daily'?'日付':'投稿','インプレッション','反応率','保存','フォロー','いいね','返信'].map(s=>`<th scope="col">${s}</th>`).join('')+'</tr>';
  const max = Math.max(1,...current.rows.map(r=>r.impressions??0));
  $('tbody').innerHTML = tableRows.length ? tableRows.map(r=> {
    const title = type === 'daily' ? esc(r.date) : `<span class="post-date">${esc(r.date)}</span><p>${esc(r.text || '本文なし')}</p>${r.url?`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">投稿を見る ↗</a>`:''}`;
    const values = r.missing ? ['未取込','—','—','—','—','—'] : [num(r.impressions),pct(rate(r.engagements,r.impressions)),num(r.bookmarks),num(r.follows),num(r.likes),num(r.replies)];
    return `<tr><td>${title}</td>${values.map((v,i)=>`<td>${v}${i===0&&!r.missing&&r.impressions!==null?`<div class="bar" style="width:${r.impressions/max*100}%"></div>`:''}</td>`).join('')}</tr>`;
  }).join('') : '<tr><td colspan="7" class="empty">この期間の投稿データはありません</td></tr>';
  $('tableNote').textContent = type==='daily'?'未取込日と0の実績は区別します。':'並び順はCSV記載値の比較です。取得できない指標は末尾に表示します。';
  report = {account:'muku_sns',start,end:current.end,source:type,totals:t,engagementRate:er,previousWeekComparable:comparable,previousWeek:comparable?previous.totals:null,notes:insights,rows:current.rows};
  $('export').disabled = !current.rows.length;
}
for (const id of ['start','source','sort']) $(id).addEventListener('change', render);
for (const [id,days] of [['prev',-7],['next',7]]) $(id).addEventListener('click',()=>{if(!$('start').value)return;$('start').value=shift($('start').value,days);render();});
$('clear').addEventListener('click',()=>{datasets={daily:[],post:[]};$('status').className='';$('status').textContent='取込データを消去しました。';$('accountConfirm').checked=false;$('csvInput').disabled=true;render();});
$('export').addEventListener('click',()=>{
  if (!report) return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`muku_sns-${report.start}-${report.source}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render();
