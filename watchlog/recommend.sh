#!/bin/bash
# Read the watch log and suggest new videos to watch.
# Writes RECOMMENDED.md into the notes folder (overwritten each run).
# Needs the Claude Code CLI (`claude`).
# Usage: pnpm recommend  (or watchlog/recommend.sh)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DIR="${WATCHLOG_DIR:-$(/usr/bin/python3 -c 'import json,os,sys;print(os.path.expanduser(json.load(open(sys.argv[1]))["dir"]))' "$HERE/config.json" 2>/dev/null || echo "$HOME/Documents/BrowserTranslate-watched")}"
CLAUDE_BIN="$(command -v claude || echo "$HOME/.local/bin/claude")"
[[ -f "$DIR/index.json" ]] || { echo "no watch log yet: $DIR/index.json"; exit 0; }
cd "$DIR"

"$CLAUDE_BIN" -p --no-session-persistence \
  --allowedTools "Read,Glob,Grep,WebSearch,WebFetch,Write" \
  "คุณคือผู้ช่วยแนะนำคลิปให้เจ้าของเครื่องนี้ (เขาดูทั้งคลิปภาษาไทย และคลิปต่างประเทศที่ฟังพากย์ไทย เพื่อเรียนรู้)

1. อ่าน index.json และไฟล์ .md ของคลิปที่ดูในโฟลเดอร์นี้ (เน้น 30 วันล่าสุด และคลิปที่ดูนาน = สนใจมาก) ทั้งคลิปภาษาไทย (language: th) และภาษาอื่น
   ความคืบหน้าของแต่ละคลิป = reached_s / duration_s
   ข้ามคลิปเพลงทั้งหมด (MV, เพลง, lyric, ช่อง '- Topic' หรือ VEVO) ไม่ต้องนับเป็นความสนใจ และห้ามแนะนำคลิปเพลง
2. สรุปสั้นๆ ว่าช่วงนี้เขาสนใจเรื่องอะไร (3-5 หัวข้อ) และช่องไหนที่ดูบ่อย
3. ใช้ WebSearch หาคลิป YouTube ใหม่ๆ ที่ตรงความสนใจ 10 คลิป: ภาษาอังกฤษประมาณ 6 คลิป และภาษาไทยประมาณ 4 คลิป ห้ามแนะนำคลิปที่อยู่ใน index.json แล้ว ทุกลิงก์ต้องเป็น URL youtube.com/watch จริงที่เจอจากการค้น ห้ามแต่งขึ้น
4. เขียนไฟล์ RECOMMENDED.md (ภาษาไทย) ทับของเดิม: หัวข้อ, วันที่วันนี้, สรุปความสนใจ,
   ส่วน '## ดูต่อให้จบ' = คลิปใน index.json ที่ดูไม่ถึง 90% และน่าดูต่อ (ไม่เกิน 5 คลิป) พร้อมลิงก์ที่มี &t=<reached_s>s,
   แล้วส่วน '## คลิปใหม่' = รายการคลิป: ชื่อ · ช่อง · ภาษา · ลิงก์ · ทำไมน่าดู 1 บรรทัด (โยงกับคลิปที่เขาเคยดู)

ตอบกลับแค่ 'done' เมื่อเขียนไฟล์เสร็จ"
echo "→ $DIR/RECOMMENDED.md"
