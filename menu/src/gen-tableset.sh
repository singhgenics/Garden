#!/bin/bash
# Free Google Flow images for the table-setting page. Writes img/tableset/<id>.jpg (1200x900). Skips ids that exist.
set -u
cd "$(dirname "$0")/.."
PROJECT=5657dbf4-d0a4-414b-9fda-48d501728c40
OUT=${FLOW_OUT:-/tmp/flow-table}; mkdir -p "$OUT" img/tableset
C=img/crockery
STYLE="Photorealistic, natural soft window light, shallow depth of field, real restaurant photography, no people, no text, no logos. Warm reclaimed-timber table, a small Goan pub-restaurant with limewash walls."
job(){ id=$1; shift; refs=$1; shift; prompt="$*"
  [ -f "img/tableset/$id.jpg" ] && { echo "skip $id"; return; }
  args=(); for r in $refs; do args+=(--ref "$C/$r.jpg"); done
  d="$OUT/$id"; rm -rf "$d"; mkdir -p "$d"
  for try in 1 2 3; do
    gflow image i2i "$prompt $STYLE" "${args[@]}" --model nano2 --aspect 4:3 -n 1 --project "$PROJECT" --out "$d" >"$d/log.txt" 2>&1; f=$(ls "$d"/*.png "$d"/*.jpg "$d"/*.jpeg "$d"/*.webp 2>/dev/null | head -1)
    [ -n "$f" ] && break; echo "retry $id ($try)"; sleep 8
  done
  if [ -n "${f:-}" ]; then python3 -c "
from PIL import Image
im=Image.open('$f').convert('RGB'); im=im.resize((1200,900),Image.LANCZOS); im.save('img/tableset/$id.jpg','JPEG',quality=84,optimize=True)"; echo "done $id"; else echo "FAILED $id"; tail -3 "$d/log.txt"; fi
}
job hero "side napkin sauces" "Overhead top-down photo of a wooden restaurant table for four, set and waiting before service. Each of four places has a stoneware side plate with a rice bowl stacked on it, a small white dipping dish, a white porcelain soup spoon, black chopsticks resting on a ceramic chopstick rest, a folded oatmeal cotton napkin with a red stripe, and a water tumbler on a red printed card coaster. Down the middle of the table sit a black condiment caddy with three glass cruets, a glass cutlery cup, a glass water carafe."
job cover "side chop napkin" "Close-up three-quarter angle photo of one place setting on a wooden restaurant table: stoneware side plate with a rice bowl stacked on it, small dipping dish, white porcelain soup spoon, black chopsticks on a ceramic rest, folded oatmeal napkin with a red stripe, water glass on a red card coaster."
job centre "sauces carafe" "Photo of the centre of a wooden restaurant table: a black metal condiment caddy holding three glass cruets with steel pour spouts (dark soy, green chillies in vinegar, red chilli oil), a glass cup of forks and spoons, a glass water carafe, and a white enamel bowl with a dark rim filled with golden cheese straw twists."
job cheeselings "enbowl" "Close-up of a white enamel bowl with a dark rim filled with crisp golden baked cheese twists (cheeselings), a few spilled on a dark wooden table, warm light."
job sauces "sauces" "Close-up of a black condiment caddy on a wooden restaurant table with three glass cruets with steel pour spouts: dark soy sauce, green chillies in clear vinegar, and red chilli oil. Small paper tags tied to the necks."
job room "side sauces" "Eye-level photo of a small empty Indian pub-restaurant minutes before opening: two wooden tables for two set with side plates, stacked rice bowls, chopsticks, napkins with red stripes, water glasses and a condiment caddy each, a window with afternoon light, brick and limewash walls, a red neon glow in the background."
