#!/usr/bin/python3
"""
Native messaging host: com.bizdrive.watchlog

Receives one WatchRecord per message from the BrowserTranslate personal build
and keeps a watch log up to date in a folder of notes (Obsidian-friendly):

  <dir>/<first-watched-date>_<videoId>.md   one note per video
  <dir>/index.json                           everything, by videoId
  <dir>/INDEX.md                             newest first

<dir> comes from config.json beside this file, which setup writes.

Everything stays on this Mac. Standard library only.
"""
import json
import os
import re
import struct
import sys
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))


def out_dir():
    """Where notes go: config.json beside this file (setup writes it), else ~/Documents."""
    if os.environ.get('WATCHLOG_DIR'):
        return os.environ['WATCHLOG_DIR']
    try:
        with open(os.path.join(HERE, 'config.json'), encoding='utf-8') as f:
            return os.path.expanduser(json.load(f)['dir'])
    except (OSError, KeyError, ValueError):
        return os.path.expanduser('~/Documents/BrowserTranslate-watched')


OUT = out_dir()
BKK = timezone(timedelta(hours=7))


def read_message():
    raw = sys.stdin.buffer.read(4)
    if len(raw) < 4:
        return None
    (n,) = struct.unpack('<I', raw)
    return json.loads(sys.stdin.buffer.read(n).decode('utf-8'))


def reply(obj):
    data = json.dumps(obj).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(data)) + data)
    sys.stdout.buffer.flush()


def mmss(ms):
    s = int(ms // 1000)
    return f'{s // 3600}:{s // 60 % 60:02d}:{s % 60:02d}' if s >= 3600 else f'{s // 60}:{s % 60:02d}'


def minutes(s):
    return f'{round(s / 60)} นาที' if s >= 60 else f'{s} วินาที'


def yaml_str(v):
    return json.dumps(v, ensure_ascii=False)


def note(rec, entry):
    lines = [
        '---',
        f'video_id: {rec["videoId"]}',
        f'title: {yaml_str(rec["title"])}',
        f'channel: {yaml_str(rec["channel"])}',
        f'url: {rec["url"]}',
        f'language: {rec.get("language") or ""}',
        f'duration_s: {rec["durationS"]}',
        f'watched_s: {entry["watched_s"]}',
        f'reached_s: {rec["reachedS"]}',
        f'dubbed: {str(entry["dubbed"]).lower()}',
        f'first_watched: {entry["first_watched"]}',
        f'last_watched: {entry["last_watched"]}',
        f'times_watched: {len(entry["sessions"])}',
        f'keywords: {yaml_str(rec.get("keywords") or [])}',
        'tags: [watched, youtube]',
        '---',
        '',
        f'# {rec["title"]}',
        '',
        f'**ช่อง:** {rec["channel"]} · [เปิดคลิป]({rec["url"]}) · ยาว {minutes(rec["durationS"])} · '
        f'ดูไป {minutes(entry["watched_s"])}' + (' · พากย์ไทย' if entry['dubbed'] else ''),
        '',
    ]
    desc = (rec.get('description') or '').strip()
    if desc:
        lines += ['## คำอธิบายคลิป', '', desc, '']
    tr = rec.get('transcript') or []
    if tr:
        has_th = any(t.get('translation') for t in tr)
        lines += ['## บทพูด' + (' (แปลไทย)' if has_th else ''), '']
        for t in tr:
            text = (t.get('translation') or t.get('text') or '').strip()
            if text:
                lines.append(f'- `{mmss(t.get("startMs", 0))}` {text}')
        lines.append('')
    return '\n'.join(lines)


def index_md(index):
    rows = sorted(index.values(), key=lambda e: e['last_watched'], reverse=True)
    out = ['# คลิปที่ดู', '', f'ทั้งหมด {len(rows)} คลิป · อัปเดตอัตโนมัติจาก BrowserTranslate', '',
           '| ดูล่าสุด | คลิป | ช่อง | ดูไป | พากย์ |', '|---|---|---|---|---|']
    for e in rows:
        title = e['title'].replace('|', '/')
        out.append(f'| {e["last_watched"][:10]} | [[{e["file"][:-3]}\\|{title}]] | {e["channel"].replace("|", "/")} | '
                   f'{minutes(e["watched_s"])} | {"✓" if e["dubbed"] else ""} |')
    return '\n'.join(out) + '\n'


def write(path, text):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(text)
    os.replace(tmp, path)


def save(rec):
    if not re.fullmatch(r'[\w-]{6,20}', rec.get('videoId', '')):
        raise ValueError('bad videoId')
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, 'index.json')
    index = json.load(open(idx_path, encoding='utf-8')) if os.path.exists(idx_path) else {}
    now = datetime.fromisoformat(rec['at'].replace('Z', '+00:00')).astimezone(BKK).isoformat(timespec='minutes')
    vid = rec['videoId']
    entry = index.get(vid) or {
        'first_watched': now, 'sessions': {}, 'file': f'{now[:10]}_{vid}.md',
    }
    # One sitting is one session; its total grows with each flush, so the
    # session's figure is replaced, not added to.
    session = rec.get('session') or now
    entry['sessions'][session] = rec['watchedS']
    entry.update({
        'title': rec['title'], 'channel': rec['channel'], 'url': rec['url'],
        'language': rec.get('language') or '', 'duration_s': rec['durationS'],
        'watched_s': sum(entry['sessions'].values()),
        'dubbed': bool(entry.get('dubbed')) or bool(rec['dubbed']),
        'last_watched': now,
    })
    index[vid] = entry
    write(os.path.join(OUT, entry['file']), note(rec, entry))
    write(idx_path, json.dumps(index, ensure_ascii=False, indent=1))
    write(os.path.join(OUT, 'INDEX.md'), index_md(index))


LOG = os.path.expanduser('~/Library/Logs/bt-watchlog.log')


def log(line):
    try:
        with open(LOG, 'a', encoding='utf-8') as f:
            f.write(f'{datetime.now(BKK).isoformat(timespec="seconds")} {line}\n')
    except OSError:
        pass


def main():
    msg = read_message()
    if msg is None:
        return
    try:
        save(msg)
        log(f'ok {msg.get("videoId")} {msg.get("watchedS")}s {msg.get("title", "")[:60]}')
        reply({'ok': True})
    except Exception as e:  # noqa: BLE001 — report, never crash the browser side
        log(f'error {type(e).__name__}: {e}')
        reply({'ok': False, 'error': str(e)})


if __name__ == '__main__':
    main()
