#!/bin/bash
# usage: src/gen-variants.sh <id> [<id>...]   (no ids = all)  Free Google Flow images, same project as the rest.
# Writes img/plating/<id>.jpg (900x675). Needs `gflow auth status` signed in as the brandcanvastc profile.
set -u
cd "$(dirname "$0")/.."
PROJECT=5657dbf4-d0a4-414b-9fda-48d501728c40
OUT=${FLOW_OUT:-/tmp/flow-variants}; mkdir -p "$OUT"
ids=("$@"); [ ${#ids[@]} -eq 0 ] && ids=($(python3 -c "import sys;sys.path.insert(0,'src');import importlib;m=importlib.import_module('plating-variant-jobs'.replace('-','_')) if False else __import__('runpy').run_path('src/plating-variant-jobs.py');print(' '.join(m['JOBS']))"))
for id in "${ids[@]}"; do
  [ -f "img/plating/$id.jpg" ] && { echo "skip $id (exists)"; continue; }
  REFARGS=(); PROMPT=""
  while IFS= read -r line; do if [ -z "$PROMPT" ] && [ "${line:0:6}" = "__REF " ]; then REFARGS+=(--ref "${line:6}"); else PROMPT="$line"; fi; done < <(python3 - "$id" <<'PY'
import sys,runpy
m=runpy.run_path('src/plating-variant-jobs.py'); refs,prompt=m['JOBS'][sys.argv[1]]
for r in refs: print('__REF img/crockery/%s.jpg'%r)
print(prompt)
PY
)
  d="$OUT/$id"; rm -rf "$d"; mkdir -p "$d"
  ok=0
  for try in 1 2 3; do
    gflow image i2i "$PROMPT" "${REFARGS[@]}" --model nano2 --aspect 4:3 -n 1 --project "$PROJECT" --out "$d" >"$d/log.txt" 2>&1 && f=$(ls "$d"/*.png "$d"/*.jpg "$d"/*.jpeg "$d"/*.webp 2>/dev/null | head -1) && [ -n "$f" ] && { ok=1; break; }
    echo "retry $id ($try)"; sleep 8
  done
  if [ $ok = 1 ]; then python3 -c "
from PIL import Image;import sys
im=Image.open('$f').convert('RGB'); im=im.resize((900,675),Image.LANCZOS); im.save('img/plating/$id.jpg','JPEG',quality=84,optimize=True)"; echo "done $id"; else echo "FAILED $id"; tail -3 "$d/log.txt"; fi
done
