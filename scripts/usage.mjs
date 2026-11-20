#!/usr/bin/env node
// หน้าสถิติการดู + การกินเครดิต — `pnpm usage` (หรือ `node scripts/usage.mjs [วัน] [--no-open]`)
// อ่านคีย์จาก .env.local และบันทึกการดูจาก watch log (watchlog/config.json), สรุปในเทอร์มินัล
// แล้วเปิดหน้าเว็บที่เขียนไว้ใน temp (ไม่อยู่ใน repo, ไม่มีคีย์ในหน้า)
// ponytail: ไม่มีเซิร์ฟเวอร์ — รันใหม่เมื่ออยากได้ตัวเลขล่าสุด
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
process.loadEnvFile(here('../.env.local'));
const EL = process.env.WXT_ELEVENLABS_KEY;
const OR = process.env.WXT_OPENROUTER_KEY;
const days = Number(process.argv[2]) || 30;
const PLAN = 121_000; // Creator: 121k เครดิต/เดือน
const GOAL_MIN = 30; // เป้าดูวันละ 30 นาที

const get = async (url, headers) => {
  const r = await fetch(url, { headers });
  const body = await r.json().catch(() => ({}));
  return r.ok ? body : { error: body?.detail?.message || body?.error?.message || `HTTP ${r.status}` };
};
const elGet = (path) => (EL ? get(`https://api.elevenlabs.io${path}`, { 'xi-api-key': EL }) : { error: 'ไม่มี WXT_ELEVENLABS_KEY' });
const orGet = (path) => (OR ? get(`https://openrouter.ai/api/v1${path}`, { Authorization: `Bearer ${OR}` }) : { error: 'ไม่มี WXT_OPENROUTER_KEY' });

const since = Date.now() / 1000 - days * 86400;
/** ElevenLabs history ย้อนหลัง `days` วัน: [{ t: unix วินาที, c: เครดิต }] */
async function history() {
  const items = [];
  let after = '';
  for (;;) {
    const page = await elGet(`/v1/history?page_size=1000${after && `&start_after_history_item_id=${after}`}`);
    if (page.error) return { error: page.error, items };
    for (const h of page.history) {
      if (h.date_unix < since) return { items };
      items.push({ t: h.date_unix, c: h.character_count_change_to - h.character_count_change_from });
    }
    if (!page.has_more) return { items };
    after = page.last_history_item_id;
  }
}

/** บันทึกการดูจาก watch log: index.json ในโฟลเดอร์ที่ install.sh ตั้งไว้ */
let WDIR = '';
try {
  WDIR = (process.env.WATCHLOG_DIR || JSON.parse(readFileSync(here('../watchlog/config.json'), 'utf8')).dir).replace(/^~/, homedir());
} catch { /* ยังไม่ได้ติดตั้งตัวบันทึก */ }
// คลิปเพลงไม่นับ (พี่แบงค์ไม่ต้องการบันทึก) — ponytail: เดาจากชื่อคลิป/ช่อง เพราะ log ไม่มีหมวดของ YouTube
const MUSIC = /(\s-\sTopic$|VEVO|official\s+(music\s+)?(video|audio|mv)|lyric|\bM\/?V\b|karaoke|คาราโอเกะ|เพลง|เนื้อเพลง|cover\s+version|\(audio\)|full\s+album)/i;
const isMusic = (v) => v.music === true || MUSIC.test(v.title || '') || MUSIC.test(v.channel || '');
function watched() {
  try {
    return Object.entries(JSON.parse(readFileSync(join(WDIR, 'index.json'), 'utf8'))).filter(([, v]) => !isMusic(v));
  } catch {
    return [];
  }
}

const [elSub, hist, orKey, orCredits] = await Promise.all([elGet('/v1/user/subscription'), history(), orGet('/key'), orGet('/credits')]);

// ทุกช่วงที่นั่งดู (session) ของทุกคลิป เรียงตามเวลาเริ่ม
const sessions = watched()
  .flatMap(([id, v]) => Object.entries(v.sessions).map(([at, s]) => ({ id, start: Date.parse(at) / 1000, s })))
  .filter((x) => x.start >= since)
  .sort((a, b) => a.start - b.start);
// เครดิตแต่ละครั้งยกให้ช่วงดูที่เริ่มล่าสุดก่อนหน้านั้น ถ้ายังอยู่ในช่วง (เวลาที่ดู + เผื่อหยุดพัก 10 นาที)
// ponytail: จับคู่ด้วยเวลา ไม่ได้ติดป้ายคลิปตอนเรียกเสียง — ดูสองแท็บพร้อมกันจะนับรวมให้คลิปที่เปิดทีหลัง
const credits = new Map();
let unmatched = 0;
for (const h of hist.items) {
  let s = null;
  for (const x of sessions) if (x.start <= h.t + 60) s = x; else break;
  if (s && h.t <= s.start + s.s + 600) credits.set(s.id, (credits.get(s.id) || 0) + h.c);
  else unmatched += h.c;
}

const bkkDay = (unix) => new Date((unix + 7 * 3600) * 1000).toISOString().slice(0, 10);
const dayList = Array.from({ length: days }, (_, i) => bkkDay(Date.now() / 1000 - (days - 1 - i) * 86400));
const perDay = Object.fromEntries(dayList.map((d) => [d, { c: 0, m: 0 }]));
for (const h of hist.items) if (perDay[bkkDay(h.t)]) perDay[bkkDay(h.t)].c += h.c;
for (const x of sessions) if (perDay[bkkDay(x.start)]) perDay[bkkDay(x.start)].m += x.s / 60;

const idx = Object.fromEntries(watched());
const clips = [...new Set(sessions.map((x) => x.id))]
  .map((id) => ({ id, ...idx[id], pct: idx[id].duration_s ? Math.min(100, (100 * (idx[id].reached_s ?? idx[id].watched_s)) / idx[id].duration_s) : 0, min: sessions.filter((x) => x.id === id).reduce((a, x) => a + x.s, 0) / 60, c: credits.get(id) || 0 }))
  .sort((a, b) => b.last_watched.localeCompare(a.last_watched));
const totMin = clips.reduce((a, x) => a + x.min, 0);
const dubMin = clips.filter((x) => x.c > 0).reduce((a, x) => a + x.min, 0);
const dubCr = clips.reduce((a, x) => a + x.c, 0);
const rate = dubMin > 1 ? dubCr / dubMin : 0; // เครดิตต่อนาทีที่ดูแบบพากย์

// คลิปแนะนำ: RECOMMENDED.md จาก watchlog/recommend.sh — เก่ากว่า 7 วันก็สั่งทำใหม่เบื้องหลัง (ใช้ Claude CLI, ราว 1–3 นาที)
const recPath = WDIR && join(WDIR, 'RECOMMENDED.md');
const recAgeDays = recPath && existsSync(recPath) ? (Date.now() - statSync(recPath).mtimeMs) / 864e5 : Infinity;
const recRefreshing = clips.length > 0 && recAgeDays > 7 && !process.argv.includes('--no-recommend');
if (recRefreshing) spawn('bash', [here('../watchlog/recommend.sh')], { detached: true, stdio: 'ignore' }).unref();
const recMd = recAgeDays < Infinity ? readFileSync(recPath, 'utf8') : '';

const n = (x) => Math.round(x).toLocaleString('th-TH');
const usd = (x) => `$${Number(x).toFixed(2)}`;
const k = orKey.data, cr = orCredits.data;
const histTotal = hist.items.reduce((a, x) => a + x.c, 0);

// เดือนนี้ เทียบกับแพ็กเกจ
let month = ['ElevenLabs เดือนนี้', '—', elSub.error || ''];
if (!elSub.error) {
  const left = elSub.character_limit - elSub.character_count;
  const daysLeft = Math.max(1, (elSub.next_character_count_reset_unix - Date.now() / 1000) / 86400);
  const perDayLeft = left / daysLeft;
  month = ['ElevenLabs คงเหลือรอบนี้', n(left),
    `ใช้ ${n(elSub.character_count)} / ${n(elSub.character_limit)} · รีเซ็ต ${new Date(elSub.next_character_count_reset_unix * 1000).toLocaleDateString('th-TH')} · ` +
    `ใช้ได้วันละ ${n(perDayLeft)}` + (rate ? ` ≈ ${n(perDayLeft / rate)} นาที/วัน` : '')];
}

const cards = [
  ['ดูไป ' + days + ' วัน', n(totMin) + ' นาที', `${clips.length} คลิป · พากย์ ${n(dubMin)} นาที · เฉลี่ย ${n(totMin / days)} นาที/วัน (เป้า ${GOAL_MIN})`],
  ['เครดิตต่อนาทีที่พากย์', rate ? n(rate) : '—', rate ? `เป้า ${GOAL_MIN} นาที/วัน ≈ ${n(rate * GOAL_MIN * 30)} เครดิต/เดือน (แพ็กเกจ ${n(PLAN)})` : 'ยังไม่มีคลิปที่พากย์ในบันทึกการดู'],
  ['ElevenLabs ใช้ไป ' + days + ' วัน', hist.error ? '—' : n(histTotal) + ' เครดิต', hist.error || `จับคู่กับคลิปไม่ได้ ${n(unmatched)} (ก่อนเริ่มบันทึก/ทดสอบ)`],
  month,
  ['OpenRouter คีย์ของส่วนขยาย', k ? usd(k.usage) : '—', k ? `วันนี้ ${usd(k.usage_daily)} · สัปดาห์ ${usd(k.usage_weekly)} · เดือน ${usd(k.usage_monthly)}` : orKey.error],
  ['OpenRouter เงินคงเหลือทั้งบัญชี', cr ? usd(cr.total_credits - cr.total_usage) : '—', cr ? `เติม ${usd(cr.total_credits)} · ใช้ ${usd(cr.total_usage)}` : orCredits.error],
];

console.log(`\nสถิติการดูและเครดิต ${new Date().toLocaleString('th-TH')}`);
for (const [t, v, s] of cards) console.log(`  ${t.padEnd(30)} ${String(v).padStart(14)}   ${s}`);
for (const x of clips.slice(0, 10)) console.log(`  ${x.last_watched.slice(5, 16)}  ${(x.language || '?').padEnd(3)} ${n(x.pct).padStart(3)}%  ${n(x.min).padStart(4)} นาที  ${n(x.c).padStart(6)} เครดิต  ${x.title.slice(0, 50)}`);
if (recRefreshing) console.log('\n  กำลังทำรายการคลิปแนะนำใหม่เบื้องหลัง (1–3 นาที) — รัน pnpm usage อีกครั้งเพื่อดู');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const md = (src) => src.split('\n').map((l) => {
  const t = esc(l).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2">$2</a>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  return /^#{1,3} /.test(l) ? `<h3>${t.replace(/^#+ /, '')}</h3>` : /^\s*[-*\d.]+ /.test(l) ? `<li>${t.replace(/^\s*[-*\d.]+ /, '')}</li>` : t ? `<p>${t}</p>` : '';
}).join('');
const resume = (x) => (x.pct < 90 && x.reached_s ? `${x.url}${x.url.includes('?') ? '&' : '?'}t=${x.reached_s}s` : x.url);
const bars = (key, unit, cls) => {
  const max = Math.max(1, ...dayList.map((d) => perDay[d][key]));
  return `<div class="chart">${dayList.map((d) => `<div class="b ${cls}" style="height:${(perDay[d][key] / max) * 100}%" title="${d}: ${n(perDay[d][key])} ${unit}"></div>`).join('')}</div>
<div class="x">${dayList.map((d, i) => `<span>${i % 5 === 0 ? d.slice(5) : ''}</span>`).join('')}</div>`;
};
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>สถิติการดูและเครดิต</title>
<style>
:root{--bg:#f7f7f5;--card:#fff;--fg:#1d1d1b;--mut:#6b6b66;--bar:#3a6ff7;--bar2:#e0892b;--line:#e4e4e0}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--card:#20201f;--fg:#ededea;--mut:#9a9a94;--bar:#7a9cff;--bar2:#f0a75a;--line:#33332f}}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;padding:24px 16px;max-width:960px;margin:auto}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px}.mut{color:var(--mut);font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:20px 0}
.c{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.v{font-size:24px;font-weight:600;margin:4px 0;font-variant-numeric:tabular-nums}
.chart{display:flex;align-items:flex-end;gap:3px;height:140px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 14px 0}
.b{flex:1;background:var(--bar);border-radius:3px 3px 0 0;min-height:1px}.b.o{background:var(--bar2)}
.x{display:flex;gap:3px;padding:4px 14px;font-size:10px;color:var(--mut)}.x span{flex:1;text-align:center;overflow:hidden}
.t{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}
h3{font-size:15px;margin:14px 0 6px}.rec p{margin:4px 0}.rec li{margin:4px 0 4px 18px}
td.r,th.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}a{color:inherit}
</style>
<h1>สถิติการดูและเครดิต</h1>
<div class="mut">อัปเดต ${esc(new Date().toLocaleString('th-TH'))} · รัน <code>pnpm usage</code> อีกครั้งเพื่อดูตัวเลขล่าสุด</div>
<div class="grid">${cards.map(([t, v, s]) => `<div class="c"><div class="mut">${esc(t)}</div><div class="v">${esc(v)}</div><div class="mut">${esc(s)}</div></div>`).join('')}</div>
<h2>นาทีที่ดูต่อวัน</h2>${bars('m', 'นาที', 'o')}
<h2>เครดิต ElevenLabs ต่อวัน</h2>${bars('c', 'เครดิต', '')}
<h2>รายคลิป (${clips.length})</h2>
${clips.length ? `<div class="t"><table><tr><th>ดูล่าสุด</th><th>คลิป</th><th>ภาษา</th><th class="r">ดูไป</th><th class="r">นาที</th><th class="r">เครดิต</th><th class="r">ต่อนาที</th></tr>
${clips.map((x) => `<tr><td class="r">${esc(x.last_watched.slice(5, 16).replace('T', ' '))}</td><td><a href="${esc(resume(x))}">${esc(x.title)}</a><div class="mut">${esc(x.channel)}</div></td><td>${x.language === 'th' ? 'ไทย' : esc(x.language || '?')}</td><td class="r">${n(x.pct)}%</td><td class="r">${n(x.min)}</td><td class="r">${x.c ? n(x.c) : '—'}</td><td class="r">${x.c && x.min ? n(x.c / x.min) : '—'}</td></tr>`).join('')}
</table></div>` : '<div class="mut">ยังไม่มีคลิปในบันทึกการดู — ดูคลิปบน YouTube แล้วรันใหม่</div>'}
<h2>ดูต่อให้จบ</h2>
${clips.filter((x) => x.pct < 90 && x.duration_s).slice(0, 8).map((x) => `<div class="c" style="margin-bottom:8px"><a href="${esc(resume(x))}">${esc(x.title)}</a> <span class="mut">· ดูไป ${n(x.pct)}% · ${esc(x.channel)}</span></div>`).join('') || '<div class="mut">ไม่มีคลิปที่ดูค้างไว้</div>'}
<h2>คลิปแนะนำ</h2>
<div class="mut">${recRefreshing ? 'กำลังทำรายการใหม่เบื้องหลัง รัน pnpm usage อีกครั้งในอีก 1–3 นาที · ' : ''}${recMd ? `ทำเมื่อ ${n(recAgeDays)} วันก่อน · ทำใหม่ได้ด้วย <code>pnpm recommend</code>` : ''}</div>
${recMd ? `<div class="c rec">${md(recMd)}</div>` : '<div class="mut">ยังไม่มีรายการแนะนำ จะทำให้อัตโนมัติเมื่อมีคลิปในบันทึกการดู</div>'}`;

const out = join(tmpdir(), 'thai-dub-usage.html');
writeFileSync(out, html);
console.log(`\nหน้าเว็บ: ${out}`);
if (!process.argv.includes('--no-open')) execFile('open', [out]);
