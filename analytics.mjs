// CSV data never leaves the browser. Missing metrics remain null, not zero.
export const METRICS = {
  impressions: ['Impressions', 'Views', 'インプレッション数', 'インプレッション', '表示回数'],
  engagements: ['Engagements', 'エンゲージメント', 'エンゲージメント数'],
  likes: ['Likes', 'いいね', 'いいね数'],
  reposts: ['Retweets', 'Reposts', 'リポスト', 'リポスト数', 'リツイート'],
  replies: ['Replies', '返信', '返信数'],
  bookmarks: ['Bookmarks', 'ブックマーク', 'ブックマーク数'],
  profile: ['Profile visits', 'User profile clicks', 'プロフィールへのアクセス数', 'プロフィールクリック数', 'プロフィールへのアクセス'],
  follows: ['New follows', 'Follows', '新しいフォロー', 'フォロー数'],
  unfollows: ['Unfollows', 'フォロー解除'],
  posts: ['Create Post', 'Posts', 'ポストを作成'],
};
const normalize = s => s.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_]+/g, ' ');
export function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else if (!quoted && field !== '') throw Error('CSVの引用符が不正です。元のCSVを選択してください。');
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(field); field = '';
      if (c !== ',') {
        if (row.some(v => v.trim())) rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else field += c;
  }
  if (quoted) throw Error('CSVの引用符が閉じていません。');
  row.push(field); if (row.some(v => v.trim())) rows.push(row);
  if (rows.length < 2) throw Error('ヘッダーとデータ行が必要です。');
  const headers = rows.shift().map(v => v.trim());
  if (new Set(headers.map(normalize)).size !== headers.length) throw Error('重複した列名があります。');
  rows.forEach((r, i) => { if (r.length !== headers.length) throw Error(`${i + 2}行目の列数が一致しません。`); });
  return { headers, rows };
}
export const shift = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
export function monday(date) {
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return shift(date, -(day + 6) % 7);
}
export function dateValue(raw) {
  const s = raw.trim();
  const dateOnly = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (dateOnly) {
    const d = `${dateOnly[1]}-${dateOnly[2].padStart(2, '0')}-${dateOnly[3].padStart(2, '0')}`;
    return Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d ? d : null;
  }
  // X legacy exports use YYYY-MM-DD HH:mm +0000. Zone-less timestamps are UTC.
  let stamp = s.replace(/^(\d{4}-\d\d-\d\d) (\d\d:\d\d(?::\d\d)?)/, '$1T$2').replace(/ ([+-]\d{4})$/, '$1');
  if (/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?$/.test(stamp)) stamp += 'Z';
  if (!/^\d{4}-\d\d-\d\dT/.test(stamp)) return null;
  const time = Date.parse(stamp);
  return Number.isFinite(time) ? new Date(time + 9 * 3600000).toISOString().slice(0, 10) : null;
}
export function importCSV(text) {
  const { headers, rows } = parseCSV(text);
  const find = names => headers.findIndex(h => names.map(normalize).includes(normalize(h)));
  const dateCol = find(['Date', 'Time', 'Post time', 'Created at', '日付', '日時', '投稿日時']);
  const idCol = find(['Post id', 'Tweet id', 'ポストID', 'ポスト ID', 'ツイートID']);
  const urlCol = find(['Post permalink', 'Tweet permalink', 'Post link', 'Post URL', 'ポストのリンク', 'ポストリンク', 'ポストURL', 'ツイートの固定リンク']);
  const textCol = find(['Post text', 'Tweet text', 'Text', 'ポストの本文', 'ポスト本文', 'ポストのテキスト', 'ツイート本文', '本文']);
  const type = idCol >= 0 || urlCol >= 0 || textCol >= 0 ? 'post' : 'daily';
  const cols = Object.fromEntries(Object.entries(METRICS).map(([key, names]) => [key, find(names)]));
  if (dateCol < 0 || cols.impressions < 0) throw Error(`日付・インプレッション列を認識できません。列名: ${headers.join(' / ')}`);
  const data = rows.map((r, i) => {
    const date = dateValue(r[dateCol]);
    if (!date) throw Error(`${i + 2}行目の日付を認識できません: ${r[dateCol]}`);
    const values = Object.fromEntries(Object.entries(cols).map(([key, col]) => {
      const raw = col < 0 ? '' : r[col].trim().replace(/,/g, '');
      const value = raw === '' || raw === '-' ? null : Number(raw);
      if (value !== null && (!Number.isFinite(value) || value < 0)) throw Error(`${i + 2}行目の${key}が数値ではありません。`);
      return [key, value];
    }));
    const url = urlCol < 0 ? '' : r[urlCol].trim();
    const id = idCol < 0 ? '' : r[idCol].trim();
    if (url && !/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/(?:muku_sns|i\/web)\/status\/\d+(?:[/?#].*)?$/i.test(url)) {
      throw Error(`${i + 2}行目の投稿URLが muku_sns の投稿として確認できません。`);
    }
    const text = textCol < 0 ? '' : r[textCol];
    const key = type === 'daily' ? date : id || url.match(/\/status\/(\d+)/)?.[1];
    if (!key) throw Error(`${i + 2}行目: 重複防止のため投稿IDまたは投稿URLが必要です。`);
    return { key, date, text, url: url || (type === 'post' && /^\d+$/.test(id) ? `https://x.com/muku_sns/status/${id}` : ''), ...values };
  });
  return { type, data, headers };
}
export function mergeRows(existing, incoming) {
  return [...new Map([...existing, ...incoming].map(r => [r.key, r])).values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function summarize(rows, start) {
  const end = shift(start, 6);
  const selected = rows.filter(r => r.date >= start && r.date <= end);
  const totals = Object.fromEntries(Object.keys(METRICS).map(k => [k, selected.length && selected.every(r => r[k] !== null && r[k] !== undefined) ? selected.reduce((s, r) => s + r[k], 0) : null]));
  return { rows: selected, days: new Set(selected.map(r => r.date)).size, totals, end };
}
export const rate = (numerator, denominator) => numerator !== null && denominator > 0 ? numerator / denominator : null;
