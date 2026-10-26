export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num=n=>n==null?'—':n.toLocaleString('ja-JP',{maximumFractionDigits:1});
export const pct=n=>n==null?'—':`${n.toFixed(2)}%`;
export const er=t=>t?.impressions>0&&t.engagements!=null?t.engagements/t.impressions*100:null;
export const change=(a,b)=>a!=null&&b>0?(a/b-1)*100:null;
const colors=['#14b8a6','#6366f1','#f59e0b','#f472b6'];
const svg=(title,body,h=250)=>`<svg role="img" aria-label="${esc(title)}" viewBox="0 0 500 ${h}"><title>${esc(title)}</title>${body}</svg>`;
const txt=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(s)}</text>`;
export function lineChart(series,key,label){
 if(!series?.length)return '<p class="muted">日別データ未取得</p>';
 const values=series.map(r=>r[key]),max=Math.max(1,...values.filter(v=>v!=null));
 const x=i=>55+i*425/Math.max(1,series.length-1),y=v=>190-v/max*150;
 let body='';for(let i=0;i<=3;i++){const yy=190-i*50;body+=`<path d="M55 ${yy}H480" stroke="#e2e8f0"/>`+txt(48,yy+4,num(Math.round(max*i/3)),'text-anchor="end"');}
 let segment=[];const flush=()=>{if(segment.length)body+=`<polyline points="${segment.join(' ')}" fill="none" stroke="#0d9488" stroke-width="3"/>`;segment=[]};
 series.forEach((r,i)=>{if(r[key]==null){flush();return;}segment.push(`${x(i)},${y(r[key])}`);});flush();
 series.forEach((r,i)=>{if(r[key]!=null)body+=`<circle tabindex="0" aria-label="${esc(r.date)} ${esc(label)} ${r[key]}" cx="${x(i)}" cy="${y(r[key])}" r="4" fill="#0d9488"><title>${esc(r.date)} · ${esc(label)} ${num(r[key])}</title></circle>`;if(series.length<=7||i%7===0||i===series.length-1)body+=txt(x(i),215,r.date.slice(5).replace('-','/'),'text-anchor="middle"');});
 return svg(`${label}の日別推移。欠測日は線を接続しません。`,body,235);
}
export function bars(posts,key,label){
 const sorted=[...posts].sort((a,b)=>(b[key]??-1)-(a[key]??-1));const max=Math.max(1,...sorted.map(r=>r[key]??0));
 return sorted.map((p,i)=>{const title=p.text.replace(/https?:\/\/\S+/g,'').trim()||'リンク投稿';return `<div class="rank-row"><div class="rank-name"><span class="rank-number">${i+1}</span><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" title="${esc(title)}">${esc(title.slice(0,40))}${title.length>40?'…':''}</a></div><div class="rank-track"><span style="width:${(p[key]??0)/max*100}%"></span></div><strong>${num(p[key])}</strong></div>`;}).join('')+`<p class="micro">保存上位5投稿の中で${esc(label)}順。投稿の経過時間は異なります。</p>`;
}
export function donut(t){
 const items=[['いいね',t.likes],['保存',t.bookmarks],['リポスト',t.reposts],['返信',t.replies]];
 if(items.some(([,v])=>v==null))return '<p class="muted">内訳データ未取得</p>';
 const total=items.reduce((s,[,v])=>s+v,0);if(!total)return '<p class="muted">対象の反応は0件</p>';
 let offset=0,body='';items.forEach(([name,value],i)=>{const share=value/total*100;body+=`<circle cx="145" cy="125" r="78" pathLength="100" fill="none" stroke="${colors[i]}" stroke-width="30" stroke-dasharray="${share} ${100-share}" stroke-dashoffset="${-offset}" transform="rotate(-90 145 125)"><title>${name}: ${num(value)} (${share.toFixed(1)}%)</title></circle>`;offset+=share;body+=`<circle cx="280" cy="${65+i*43}" r="5" fill="${colors[i]}"/>`+txt(295,69+i*43,`${name} ${num(value)}`)+txt(465,69+i*43,`${share.toFixed(1)}%`,'text-anchor="end"');});body+=txt(145,121,num(total),'text-anchor="middle" class="chart-big"')+txt(145,143,'反応件数','text-anchor="middle"');return svg('反応の内訳。いいね・保存・リポスト・返信の合計。人数ではありません。',body);
}
export function radar(t,prior){
 if(!prior)return '<p class="muted">比較期間のデータ未取得</p>';
 const axes=[['表示',t.impressions,prior.impressions],['保存',t.bookmarks,prior.bookmarks],['フォロー',t.follows,prior.follows],['プロフ訪問',t.profile,prior.profile],['反応率',er(t),er(prior)]];
 if(axes.some(([,a,b])=>a==null||!(b>0)))return '<p class="muted">前期間が0または未取得の指標があるため、比較できません。</p>';
 const ratios=axes.map(([,a,b])=>a/b*100),scale=Math.ceil(Math.max(100,...ratios)/100)*100;
 const point=(i,v)=>{const a=-Math.PI/2+i*Math.PI*2/5;return [250+Math.cos(a)*v,140+Math.sin(a)*v];};
 const polygon=values=>values.map((v,i)=>point(i,v/scale*88).join(',')).join(' ');
 let body='';for(let step=1;step<=3;step++)body+=`<polygon points="${polygon(Array(5).fill(scale*step/3))}" fill="none" stroke="#e2e8f0"/>`;
 axes.forEach(([name],i)=>{const [x,y]=point(i,88),[lx,ly]=point(i,112);body+=`<path d="M250 140L${x} ${y}" stroke="#e2e8f0"/>`+txt(lx,ly,name,'text-anchor="middle"')+txt(lx,ly+15,`${ratios[i].toFixed(0)}`,'text-anchor="middle" class="axis-value"');});
 body+=`<polygon points="${polygon(Array(5).fill(100))}" fill="#6366f115" stroke="#6366f1" stroke-dasharray="4 4"/><polygon points="${polygon(ratios)}" fill="#14b8a630" stroke="#0d9488" stroke-width="2"/>`;
 return svg(`前期間を100とした比較。外周${scale}。${axes.map(([n],i)=>n+ratios[i].toFixed(0)).join('、')}`,body,280)+`<p class="micro">紫：前期間100 ／ 緑：今回。外周${scale}。総合評価点ではありません。</p>`;
}
