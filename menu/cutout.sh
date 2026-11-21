#!/bin/bash
# Cuts each cut/<name>/*.jpg (dish photographed on flat cyan) out into cut/<name>.png with a transparent background.
cd "$(dirname "$0")"
for d in cut/*/; do n=$(basename $d); [[ $n == *_c ]] && continue; f=$(ls $d*.jpg 2>/dev/null | head -1); [ -z "$f" ] && continue
  magick "$f" -alpha set -fuzz 36% -fill none -opaque "#00F0FF" -fuzz 20% -fill none -opaque "#12A5AD" -fuzz 14% -fill none -opaque "#0A7F86" \
    \( +clone -channel A -morphology Erode Disk:2 -blur 0x0.8 +channel \) -compose CopyOpacity -composite \
    -trim +repage -resize 1100x1100\> cut/$n.png
done
# Glassware shot on the cream paper colour (cut/<name>_c/*.jpg): divide by the background colour so it turns white,
# then tint it with the paper colour so it sits on the page without a visible box.
for d in cut/*_c/; do n=$(basename $d _c); f=$(ls $d*.jpg 2>/dev/null | head -1); [ -z "$f" ] && continue
  bg=$(magick "$f" -format '%[pixel:p{6,6}]' info:)
  magick "$f" \( +clone -fill "$bg" -colorize 100 \) -compose Divide_Src -composite \( +clone -fill '#F7EFDC' -colorize 100 \) -compose Multiply -composite -quality 92 cut/$n.jpg
done
