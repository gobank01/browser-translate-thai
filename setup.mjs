#!/usr/bin/env node
// Thai dub setup wizard — run with:  node setup.mjs
//
// Asks for your own keys (all optional), writes .env.local (never committed),
// builds the Chrome extension into dist/chrome-mv3, and can install the watch
// log. Keys stay on this computer, inside the build you load into Chrome.
// Node 18+ and macOS (for the watch log and the free Thai voice "Kanya").
import { createInterface } from 'node:readline/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname);
const ENV_FILE = join(ROOT, '.env.local');
const rl = createInterface({ input: process.stdin, output: process.stdout });
const say = (s = '') => console.log(s);
const ask = async (q, def = '') => ((await rl.question(def ? `${q} [${def}]: ` : `${q}: `)).trim() || def);
const yes = async (q, def = true) => /^y/i.test(await ask(`${q} (y/n)`, def ? 'y' : 'n'));

function readEnv() {
  if (!existsSync(ENV_FILE)) return {};
  return Object.fromEntries(readFileSync(ENV_FILE, 'utf8').split('\n')
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
}

async function checkOpenRouter(key) {
  const res = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: { Authorization: `Bearer ${key}` } });
  return res.ok;
}

async function elevenVoices(key) {
  const res = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100', { headers: { 'xi-api-key': key } });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  const { voices = [] } = await res.json();
  return voices.map((v) => ({ id: v.voice_id, name: v.name.split(/[\s\-–]/)[0], full: v.name, gender: v.labels?.gender }));
}

async function pickVoice(voices, gender) {
  const list = voices.filter((v) => v.gender === gender);
  const pool = list.length ? list : voices;
  say(`\n  เสียง${gender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'} ในบัญชีของคุณ:`);
  pool.forEach((v, i) => say(`   ${i + 1}. ${v.full}`));
  const n = Number(await ask('  เลือกหมายเลข (Enter = ข้าม)', '')) - 1;
  return pool[n] ?? null;
}

async function main() {
  say('\n🎙  ตั้งค่า BrowserTranslate พากย์ไทย\n');
  const old = readEnv();
  const env = { WXT_THAI_DUB: '1' };

  // 1. Translation
  say('1) แปลภาษา — ใส่ OpenRouter key ได้คำแปลดีกว่า (สมัครที่ https://openrouter.ai/keys)');
  say('   ไม่ใส่ = ใช้ Google แปลฟรี');
  const or = await ask('   OpenRouter key', old.WXT_OPENROUTER_KEY ? '(ใช้ของเดิม)' : '');
  const orKey = or === '(ใช้ของเดิม)' ? old.WXT_OPENROUTER_KEY : or;
  if (orKey) {
    if (await checkOpenRouter(orKey).catch(() => false)) { env.WXT_OPENROUTER_KEY = orKey; say('   ✓ key ใช้ได้'); }
    else say('   ✗ key ใช้ไม่ได้ — จะใช้ Google แปลฟรีแทน');
  }

  // 2. Voice
  say('\n2) เสียงพากย์ — ใส่ ElevenLabs key ได้เสียงธรรมชาติ (เสียเครดิต, https://elevenlabs.io/app/settings/api-keys)');
  say('   ต้องเปิดสิทธิ์ Text to Speech และ Voices (read) ให้ key · เพิ่มเสียงไทยที่ชอบจาก Voice Library เข้าบัญชีก่อน');
  say('   ไม่ใส่ = ใช้เสียงไทย "Kanya" ของ Mac ฟรี');
  const el = await ask('   ElevenLabs key', old.WXT_ELEVENLABS_KEY ? '(ใช้ของเดิม)' : '');
  const elKey = el === '(ใช้ของเดิม)' ? old.WXT_ELEVENLABS_KEY : el;
  if (elKey) {
    try {
      const voices = await elevenVoices(elKey);
      if (!voices.length) throw new Error('ยังไม่มีเสียงในบัญชี');
      const picks = [await pickVoice(voices, 'female'), await pickVoice(voices, 'male')]
        .map((v, i) => v && `${v.name}:${v.id}:${i ? 'male' : 'female'}`).filter(Boolean);
      if (picks.length) {
        env.WXT_ELEVENLABS_KEY = elKey;
        env.WXT_DUB_VOICES = picks.join(',');
        say('   ✓ ตั้งเสียงแล้ว');
      } else say('   ไม่ได้เลือกเสียง — ใช้เสียง Mac ฟรี');
    } catch (e) {
      say(`   ✗ อ่านรายชื่อเสียงไม่ได้ (${e.message}) — ใช้เสียง Mac ฟรี`);
    }
  }

  // 3. Watch log
  let notes = '';
  if (platform() === 'darwin') {
    say('\n3) บันทึกคลิปที่ดู — จดชื่อคลิป เวลาที่ดู และบทพูดไทย เป็นไฟล์โน้ตในเครื่อง (เปิดใน Obsidian ได้)');
    if (await yes('   เปิดใช้ไหม', false)) {
      notes = await ask('   เก็บที่โฟลเดอร์', join(homedir(), 'Documents', 'BrowserTranslate-watched'));
      env.WXT_WATCHLOG = '1';
    }
  }

  writeFileSync(ENV_FILE, Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
  say(`\n✓ บันทึกการตั้งค่าที่ ${ENV_FILE} (ไม่ขึ้น git)`);

  // 4. Build
  say('\n4) ติดตั้งแพ็กเกจและ build (ครั้งแรกใช้เวลา 1–2 นาที)…');
  run('npx', ['-y', 'pnpm@10', 'install']);
  run('npx', ['-y', 'pnpm@10', 'build']);
  const dist = join(ROOT, 'dist', 'chrome-mv3');

  if (notes) {
    say('\n5) ติดตั้งตัวบันทึกคลิป…');
    run('bash', [join(ROOT, 'watchlog', 'install.sh'), notes]);
  }

  say(`
✅ เสร็จแล้ว! ขั้นสุดท้ายใน Chrome:
   1. เปิด chrome://extensions
   2. เปิด "Developer mode" (มุมขวาบน)
   3. กด "Load unpacked" แล้วเลือกโฟลเดอร์:
      ${dist}
   4. เปิดคลิป YouTube ภาษาอังกฤษ — พากย์ไทยจะเริ่มเอง

   เปลี่ยน key/เสียงทีหลัง: รัน node setup.mjs อีกรอบ แล้วกด Reload ที่ chrome://extensions
`);
  if (platform() === 'darwin') {
    try { execFileSync('open', ['-R', dist]); } catch { /* Finder is a convenience */ }
  }
}

main().catch((e) => { console.error(`\n✗ ${e.message}`); process.exitCode = 1; }).finally(() => rl.close());
