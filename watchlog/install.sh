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

# The helper itself lives outside ~/Documents: macOS does not let Chrome run a
# program from Documents unless Chrome was given that folder.
APP="$HOME/Library/Application Support/BrowserTranslate"
mkdir -p "$DIR" "$NOTES" "$APP"
cp "$HERE/host.py" "$APP/watchlog-host.py"
chmod +x "$APP/watchlog-host.py"
/usr/bin/python3 -c 'import json,sys;json.dump({"dir":sys.argv[2]},open(sys.argv[1],"w"),ensure_ascii=False)' "$APP/config.json" "$NOTES"
cp "$APP/config.json" "$HERE/config.json"
cat > "$DIR/com.bizdrive.watchlog.json" <<JSON
{
  "name": "com.bizdrive.watchlog",
  "description": "BrowserTranslate watch log",
  "path": "$APP/watchlog-host.py",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$ID/"]
}
JSON
echo "installed: $DIR/com.bizdrive.watchlog.json"
echo "notes:     $NOTES"
echo "extension: $ID"
