#!/bin/bash
# Read the watch log and suggest new videos to watch.
# Writes RECOMMENDED.md into the notes folder (overwritten each run).
# Needs the Claude Code CLI (`claude`).
# Usage: personal/watchlog/recommend.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DIR="${WATCHLOG_DIR:-$(/usr/bin/python3 -c 'import json,os,sys;print(os.path.expanduser(json.load(open(sys.argv[1]))["dir"]))' "$HERE/config.json" 2>/dev/null || echo "$HOME/Documents/BrowserTranslate-watched")}"
CLAUDE_BIN="$(command -v claude || echo "$HOME/.local/bin/claude")"
[[ -f "$DIR/index.json" ]] || { echo "no watch log yet: $DIR/index.json"; exit 0; }
cd "$DIR"

"$CLAUDE_BIN" -p --no-session-persistence \
  --allowedTools "Read,Glob,Grep,WebSearch,WebFetch,Write" \
  "คุณคือผู้ช่วยแนะนำคลิปให้เจ้าของเครื่องนี้ (เขาดูคลิปต่างประเทศแล้วฟังพากย์ไทย เพื่อเรียนรู้)

1. อ่าน index.json และไฟล์ .md ของคลิปที่ดูในโฟลเดอร์นี้ (เน้น 30 วันล่าสุด และคลิปที่ดูนาน = สนใจมาก)
2. สรุปสั้นๆ ว่าช่วงนี้เขาสนใจเรื่องอะไร (3-5 หัวข้อ) และช่องไหนที่ดูบ่อย
3. ใช้ WebSearch หาคลิป YouTube ภาษาอังกฤษใหม่ๆ ที่ตรงความสนใจ 10 คลิป ห้ามแนะนำคลิปที่อยู่ใน index.json แล้ว ทุกลิงก์ต้องเป็น URL youtube.com/watch จริงที่เจอจากการค้น ห้ามแต่งขึ้น
4. เขียนไฟล์ RECOMMENDED.md (ภาษาไทย) ทับของเดิม: หัวข้อ, วันที่วันนี้, สรุปความสนใจ, แล้วรายการคลิป: ชื่อ · ช่อง · ลิงก์ · ทำไมน่าดู 1 บรรทัด (โยงกับคลิปที่เขาเคยดู)

ตอบกลับแค่ 'done' เมื่อเขียนไฟล์เสร็จ"
echo "→ $DIR/RECOMMENDED.md"
