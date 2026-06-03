#!/usr/bin/env bash
# Re-encode hero videos for web: H.264 (yuv420p), smaller resolution, faststart.
# Requires ffmpeg on PATH (apt install ffmpeg / brew install ffmpeg).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="$ROOT/public/video"

DESKTOP_SRC="$VIDEO_DIR/zarge.mp4"
MOBILE_SRC="$VIDEO_DIR/zarge-mobile.mp4"
POSTER="$VIDEO_DIR/zarge-poster.jpg"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required. Install it, then run this script again."
  exit 1
fi

for f in "$DESKTOP_SRC" "$MOBILE_SRC"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing: $f"
    exit 1
  fi
done

backup_if_needed() {
  local file="$1"
  if [[ -f "$file" && ! -f "${file%.mp4}.source.mp4" ]]; then
    cp "$file" "${file%.mp4}.source.mp4"
    echo "Backed up $(basename "$file") -> $(basename "${file%.mp4}.source.mp4")"
  fi
}

backup_if_needed "$DESKTOP_SRC"
backup_if_needed "$MOBILE_SRC"

echo "Encoding desktop hero (max width 1280, H.264)..."
ffmpeg -y -i "$DESKTOP_SRC" -an \
  -vf "scale='min(1280,iw)':-2:flags=lanczos,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 24 -preset medium \
  -movflags +faststart \
  "$VIDEO_DIR/zarge.web.mp4"

echo "Encoding mobile hero (max width 720, H.264)..."
ffmpeg -y -i "$MOBILE_SRC" -an \
  -vf "scale='min(720,iw)':-2:flags=lanczos,fps=30" \
  -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 26 -preset medium \
  -movflags +faststart \
  "$VIDEO_DIR/zarge-mobile.web.mp4"

echo "Extracting poster frame..."
ffmpeg -y -i "$DESKTOP_SRC" -ss 00:00:00.5 -vframes 1 -q:v 3 \
  "$POSTER"

mv "$VIDEO_DIR/zarge.web.mp4" "$DESKTOP_SRC"
mv "$VIDEO_DIR/zarge-mobile.web.mp4" "$MOBILE_SRC"

echo "Done."
ls -lh "$DESKTOP_SRC" "$MOBILE_SRC" "$POSTER"
