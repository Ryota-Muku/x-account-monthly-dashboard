import {esc,num,change} from './charts.mjs';
const safeURL=u=>/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+$/.test(u||'');
const links=urls=>(urls||[]).filter(safeURL).map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">根拠${i+1} ↗</a>`).join(' · ');
export function matchedPeriod(r){
 const p=r.matchedComparison;if(!p)return '';
 return `<section class="comparison-strip"><h3>月途中は、同じ日数で比較</h3><p>${esc(r.start)}〜${esc(r.end)} ／ 比較 ${esc(p.start)}〜${esc(p.end)}（各${p.days}日）</p><div class="matched-grid">${[['表示','impressions'],['保存','bookmarks'],['新規フォロー','follows']].map(([label,key])=>{const v=change(r.totals[key],p.totals[key]);return `<div><strong>${label}</strong><p>${num(p.totals[key])} → ${num(r.totals[key])}</p><span>${v==null?'比較なし':`${v>=0?'+':''}${v.toFixed(1)}%`}</span></div>`;}).join('')}</div><p class="micro">日別活動の同日数比較。月全体の前月比ではなく、曜日構成も異なります。</p></section>`;
}
export function analysisContent(r){
 const i=r.insights;
 if(!i)return '';
 const group=(key,label)=>`<section><h3>${label}</h3>${(i[key]||[]).map(x=>`<article class="insight-card"><h4>${esc(x.title)}</h4><p>${esc(x.detail)}</p>${x.metric?`<p class="micro">確認指標：${esc(x.metric)}</p>`:''}<p class="source-links">${links(x.sources)}</p></article>`).join('')}</section>`;
 return `<section class="editorial-section" aria-label="考察と次の投稿提案"><span class="eyebrow">ANALYSIS → ACTION</span><h2>何が起きた？ 次に何を出す？</h2><p class="muted">確認できた事実、理由の仮説、次に試す案を分けています。</p><div class="insight-grid">${group('observations','数字・投稿から確認できたこと')}${group('hypotheses','伸び悩みの考察（仮説）')}</div>${group('experiments','次の投稿提案・検証すること')}</section>`;
}
export function competitorContent(r){
 const c=r.competitorResearch;if(!c)return '';
 const examples=c.examples||[];
 return `<section class="editorial-section" aria-label="同期間の競合リサーチ"><span class="eyebrow">SAME-PERIOD RESEARCH</span><h2>同じ時期、他のアカウントは何が伸びた？</h2><p>${esc(c.summary)}</p><p class="muted">${esc(c.scope)} ／ 調査更新 ${esc(c.observedAt?new Date(c.observedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}):'—')} JST</p>${c.findings?.length?`<ul>${c.findings.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}<div class="competitor-grid">${examples.map(x=>`<article class="competitor-card"><div class="competitor-meta">${esc(x.date)} · @${esc(x.author)} · ${esc(x.periodLabel||'')}</div><h3><a href="${safeURL(x.url)?esc(x.url):'#'}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a></h3><p>${esc(x.summary)}</p><div class="metric-pills"><span>表示 ${num(x.views)}</span><span>いいね ${num(x.likes)}</span><span>保存 ${num(x.bookmarks)}</span></div><p><strong>借りる着眼点：</strong>${esc(x.takeaway)}</p><p class="micro">${esc(x.format||'')} ／ ${esc(x.postType||'')}<br>${esc(x.eligibility||'')}<br>指標確認 ${esc(new Date(x.observedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}))} JST。${esc(x.verification||'本文・公開指標を確認。作者の成果は本人報告。')}</p></article>`).join('')}</div><details class="analysis-detail"><summary>比較の範囲・読み方</summary><p>${esc(c.limitations)}</p><p>表示・いいね・保存は取得時点の累積値。投稿の経過時間やアカウント規模が異なるため、同じ露出条件の比較ではありません。抽出事例からアカウント全体の成長率やアルゴリズムの因果は推定しません。</p></details></section>`;
}
