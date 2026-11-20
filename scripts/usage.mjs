#!/usr/bin/env node
// หน้าสถิติการใช้งาน ElevenLabs + OpenRouter — `pnpm usage` (หรือ `node scripts/usage.mjs [วัน]`)
// อ่านคีย์จาก .env.local, สรุปในเทอร์มินัล แล้วเปิดหน้าเว็บที่เขียนไว้ใน temp (ไม่อยู่ใน repo, ไม่มีคีย์ในหน้า)
// ponytail: ไม่มีเซิร์ฟเวอร์ — รันใหม่เมื่ออยากได้ตัวเลขล่าสุด
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url)));
const EL = process.env.WXT_ELEVENLABS_KEY;
const OR = process.env.WXT_OPENROUTER_KEY;
const days = Number(process.argv[2]) || 30;

const get = async (url, headers) => {
  const r = await fetch(url, { headers });
  const body = await r.json().catch(() => ({}));
  return r.ok ? body : { error: body?.detail?.message || body?.error?.message || `HTTP ${r.status}` };
};

const end = Date.now();
const start = end - days * 864e5;
const [elSub, elStats, orKey, orCredits] = await Promise.all([
  EL ? get('https://api.elevenlabs.io/v1/user/subscription', { 'xi-api-key': EL }) : { error: 'ไม่มี WXT_ELEVENLABS_KEY' },
  EL ? get(`https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${start}&end_unix=${end}&aggregation_interval=day`, { 'xi-api-key': EL }) : { error: 'ไม่มี WXT_ELEVENLABS_KEY' },
  OR ? get('https://openrouter.ai/api/v1/key', { Authorization: `Bearer ${OR}` }) : { error: 'ไม่มี WXT_OPENROUTER_KEY' },
  OR ? get('https://openrouter.ai/api/v1/credits', { Authorization: `Bearer ${OR}` }) : { error: 'ไม่มี WXT_OPENROUTER_KEY' },
]);

const n = (x) => Math.round(x).toLocaleString('th-TH');
const usd = (x) => `$${Number(x).toFixed(2)}`;
const daily = elStats.error ? [] : elStats.time.map((t, i) => ({ d: new Date(t).toISOString().slice(5, 10), c: elStats.usage.All[i] }));
const elTotal = daily.reduce((s, x) => s + x.c, 0);
const k = orKey.data, cr = orCredits.data;

const cards = [
  ['ElevenLabs ใช้ไป ' + days + ' วัน', elStats.error ? '—' : n(elTotal) + ' ตัวอักษร', elStats.error || `เฉลี่ย ${n(elTotal / days)}/วัน`],
  ['ElevenLabs เครดิตคงเหลือ', elSub.error ? '—' : n(elSub.character_limit - elSub.character_count),
    elSub.error ? 'คีย์ไม่มีสิทธิ์ User: Read — เปิดสิทธิ์นี้ที่ elevenlabs.io › API Keys' :
      `ใช้ ${n(elSub.character_count)} / ${n(elSub.character_limit)} · รีเซ็ต ${new Date(elSub.next_character_count_reset_unix * 1000).toLocaleDateString('th-TH')}`],
  ['OpenRouter คีย์ของส่วนขยาย', k ? usd(k.usage) : '—', k ? `วันนี้ ${usd(k.usage_daily)} · สัปดาห์ ${usd(k.usage_weekly)} · เดือน ${usd(k.usage_monthly)}` : orKey.error],
  ['OpenRouter เงินคงเหลือทั้งบัญชี', cr ? usd(cr.total_credits - cr.total_usage) : '—', cr ? `เติม ${usd(cr.total_credits)} · ใช้ ${usd(cr.total_usage)}` : orCredits.error],
];

console.log(`\nสถิติการใช้งาน ${new Date().toLocaleString('th-TH')}`);
for (const [t, v, s] of cards) console.log(`  ${t.padEnd(32)} ${String(v).padStart(16)}   ${s}`);

const max = Math.max(1, ...daily.map((x) => x.c));
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>สถิติการใช้งาน</title>
<style>
:root{--bg:#f7f7f5;--card:#fff;--fg:#1d1d1b;--mut:#6b6b66;--bar:#3a6ff7;--line:#e4e4e0}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--card:#20201f;--fg:#ededea;--mut:#9a9a94;--bar:#7a9cff;--line:#33332f}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;padding:24px 16px;max-width:960px;margin:auto}
h1{font-size:20px;margin:0 0 4px}.mut{color:var(--mut);font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:20px 0}
.c{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.v{font-size:24px;font-weight:600;margin:4px 0;font-variant-numeric:tabular-nums}
.chart{display:flex;align-items:flex-end;gap:3px;height:180px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 14px 0}
.b{flex:1;background:var(--bar);border-radius:3px 3px 0 0;min-height:1px}
.x{display:flex;gap:3px;padding:4px 14px;font-size:10px;color:var(--mut)}.x span{flex:1;text-align:center;overflow:hidden}
</style>
<h1>สถิติการใช้งาน Thai dub</h1>
<div class="mut">อัปเดต ${esc(new Date().toLocaleString('th-TH'))} · รัน <code>pnpm usage</code> อีกครั้งเพื่อดูตัวเลขล่าสุด</div>
<div class="grid">${cards.map(([t, v, s]) => `<div class="c"><div class="mut">${esc(t)}</div><div class="v">${esc(v)}</div><div class="mut">${esc(s)}</div></div>`).join('')}</div>
<h2 style="font-size:16px">ElevenLabs ตัวอักษรต่อวัน (${days} วัน)</h2>
<div class="chart">${daily.map((x) => `<div class="b" style="height:${(x.c / max) * 100}%" title="${x.d}: ${n(x.c)} ตัวอักษร"></div>`).join('')}</div>
<div class="x">${daily.map((x, i) => `<span>${i % 5 === 0 ? x.d : ''}</span>`).join('')}</div>`;

const out = join(tmpdir(), 'thai-dub-usage.html');
writeFileSync(out, html);
console.log(`\nหน้าเว็บ: ${out}`);
if (!process.argv.includes('--no-open')) execFile('open', [out]);
