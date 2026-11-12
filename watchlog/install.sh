#!/bin/bash
# Register the watch-log native host with Chrome.
#
#   watchlog/install.sh [notes-folder] [extension-id]
#
# notes-folder  where one note per watched video is written
#               (default: ~/Documents/BrowserTranslate-watched)
# extension-id  defaults to the id Chrome gives an unpacked dist/chrome-mv3
#               loaded from this checkout (derived from its path)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
NOTES="${1:-$HOME/Documents/BrowserTranslate-watched}"
ID="${2:-$(/usr/bin/python3 -c 'import hashlib,sys;h=hashlib.sha256(sys.argv[1].encode()).hexdigest()[:32];print("".join(chr(int(c,16)+97) for c in h))' "$ROOT/dist/chrome-mv3")}"
DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

mkdir -p "$DIR" "$NOTES"
chmod +x "$HERE/host.py"
/usr/bin/python3 -c 'import json,sys;json.dump({"dir":sys.argv[2]},open(sys.argv[1],"w"),ensure_ascii=False)' "$HERE/config.json" "$NOTES"
cat > "$DIR/com.bizdrive.watchlog.json" <<JSON
{
  "name": "com.bizdrive.watchlog",
  "description": "BrowserTranslate watch log",
  "path": "$HERE/host.py",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$ID/"]
}
JSON
echo "installed: $DIR/com.bizdrive.watchlog.json"
echo "notes:     $NOTES"
echo "extension: $ID"
