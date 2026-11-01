#!/bin/bash
# usage: src/gen-furnishings.sh [<id>...]   (no ids = all)  Free Google Flow images, same project as the rest.
# Writes img/furnishings/<id>.jpg (1000x750). Needs `gflow auth status` signed in as the brandcanvastc profile. Skips ids that exist; delete a file to redo it.
set -u
export GFLOW_CLI_UPDATE_CHECK=0 GFLOW_CLI_LEASE_WAIT_SECONDS=600
cd "$(dirname "$0")/.."
PROJECT=5657dbf4-d0a4-414b-9fda-48d501728c40
OUT=${FLOW_OUT:-/tmp/flow-furnishings}; mkdir -p "$OUT" img/furnishings
ids=("$@"); [ ${#ids[@]} -eq 0 ] && ids=($(python3 -c "import runpy;print(' '.join(runpy.run_path('src/furnishing-jobs.py')['JOBS']))"))
one() { id=$1
  [ -f "img/furnishings/$id.jpg" ] && { echo "skip $id (exists)"; return; }
  REFARGS=(); PROMPT=""
  while IFS= read -r line; do if [ -z "$PROMPT" ] && [ "${line:0:6}" = "__REF " ]; then REFARGS+=(--ref "${line:6}"); else PROMPT="$line"; fi; done < <(python3 - "$id" <<'PY'
import sys,runpy
m=runpy.run_path('src/furnishing-jobs.py'); refs,prompt=m['JOBS'][sys.argv[1]]
for r in refs: print('__REF src/furnishing-refs/%s.jpg'%r)
print(prompt)
PY
)
  d="$OUT/$id"; rm -rf "$d"; mkdir -p "$d"; ok=0
  for try in 1 2 3; do
    if [ ${#REFARGS[@]} -gt 0 ]; then CMD=(i2i "$PROMPT" "${REFARGS[@]}"); else CMD=(t2i "$PROMPT"); fi
    gflow image "${CMD[@]}" --model nano2 --aspect 4:3 -n 1 --project "$PROJECT" --out "$d" >"$d/log.txt" 2>&1 && f=$(ls "$d"/*.png "$d"/*.jpg "$d"/*.jpeg "$d"/*.webp 2>/dev/null | head -1) && [ -n "$f" ] && { ok=1; break; }
    echo "retry $id ($try)"; sleep 8
  done
  if [ $ok = 1 ]; then python3 -c "
from PIL import Image
im=Image.open('$f').convert('RGB'); im=im.resize((1000,750),Image.LANCZOS); im.save('img/furnishings/$id.jpg','JPEG',quality=84,optimize=True)"; echo "done $id"; else echo "FAILED $id"; tail -3 "$d/log.txt"; fi
}
for id in "${ids[@]}"; do one "$id" & while [ "$(jobs -rp | wc -l)" -ge 1 ]; do sleep 2; done; done; wait
