const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>n===null?'—':n.toLocaleString('ja-JP');
let reports=[];let generation=0;
async function show(){
 const token=++generation,id=$('reportHistory').value;
 if(!id){$('publishedBody').innerHTML='<p>月次レポートは毎月1日に前月分を更新します。まだ公開済みのレポートはありません。</p>';$('reportMeta').textContent='未作成';return;}
 try{
 const res=await fetch(`reports/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!res.ok)throw Error('fetch');const r=await res.json();if(token!==generation)return;
 $('reportMeta').textContent=`${r.start} 〜 ${r.end} · ${r.provisional?'暫定':'期間終了・日別データ充足'} · ${r.days}/${r.expectedDays}日 · 取得 ${new Date(r.acquiredAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})} JST`;
 const t=r.totals;
 $('publishedBody').innerHTML=`<div class="kpis">${[['表示',t.impressions],['保存',t.bookmarks],['新規フォロー',t.follows],['純増',t.follows!==null&&t.unfollows!==null?t.follows-t.unfollows:null]].map(([k,v])=>`<article class="kpi"><h3>${k}</h3><div class="value">${num(v)}</div></article>`).join('')}</div><h3>振り返り・次の一手</h3>${r.notes.map(n=>`<p>${esc(n)}</p>`).join('')}<h3>保存数の上位投稿</h3>${r.topPosts.map(p=>`<article class="report-post"><p>${esc(p.text)}</p><p class="muted">${esc(p.date)} · 表示 ${num(p.impressions)} / 保存 ${num(p.bookmarks)} / フォロー ${num(p.follows)}</p>${/^https:\/\/x\.com\/muku_sns\/status\/\d+$/.test(p.url)?`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">投稿を見る ↗</a>`:''}</article>`).join('')}<p class="muted">日別CSVの期間実績と、投稿別CSVの記載値は別集計です。投稿別は累積値の場合があり、因果関係や同一経過時間の比較を意味しません。元CSVは公開していません。</p>`;
 }catch{if(token===generation)$('publishedBody').textContent='レポートを読み込めませんでした。再読み込みしてください。';}
}
function choose(){const list=reports.filter(r=>r.kind===$('reportKind').value);$('reportHistory').innerHTML=list.map(r=>`<option value="${esc(r.id)}">${esc(r.start)} 〜 ${esc(r.end)}${r.provisional?'（暫定）':''}</option>`).join('');show();}
$('reportKind').addEventListener('change',choose);$('reportHistory').addEventListener('change',show);
try{const res=await fetch('reports/index.json',{cache:'no-store'});if(!res.ok)throw Error('fetch');reports=await res.json();choose();}catch{$('publishedBody').textContent='公開レポートの読込に失敗しました。';}
