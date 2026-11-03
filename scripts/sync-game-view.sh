#!/usr/bin/env bash
# Copy the rabbit-hole Unity WebGL build into public/game-view/ for /live/game (Game View).
# Build it first (needs an activated Unity license):
#   cd ../rabbit-hole && /Applications/Unity/Hub/Editor/6000.4.3f1/Unity.app/Contents/MacOS/Unity \
#     -batchmode -nographics -quit -projectPath . -executeMethod Burrow.Editor.BuildWebGL.Build -logFile -
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
src="${1:-$here/../rabbit-hole/Build/WebGL}"
[ -f "$src/Build/WebGL.loader.js" ] || { echo "no build at $src" >&2; exit 1; }
rm -rf "$here/public/game-view/Build" "$here/public/game-view/StreamingAssets"
cp -R "$src/Build" "$here/public/game-view/Build"
[ -d "$src/StreamingAssets" ] && cp -R "$src/StreamingAssets" "$here/public/game-view/StreamingAssets"
du -sh "$here/public/game-view"
