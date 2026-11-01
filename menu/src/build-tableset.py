#!/usr/bin/env python3
"""Builds table-setting.html (the 'empty table' page) from src/table-setting-source.html.
Source references photos as g/<crockery id>.jpg and g/t-<id>.jpg; the site copy points them at img/crockery and img/tableset.
The same source is published as the claude.ai artifact (g/ folder = crockery photos + t-*.jpg)."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
s = open(os.path.join(HERE, 'table-setting-source.html'), encoding='utf-8').read()
s = re.sub(r'g/t-([a-z]+)\.jpg', r'img/tableset/\1.jpg', s)
s = re.sub(r'(?<![\w/])g/([a-z0-9]+)\.jpg', r'img/crockery/\1.jpg', s)
s = s.replace('"g/${it.img}.jpg"', '"img/crockery/${it.img}.jpg"')
s = s.replace('src="g/${it.img}.jpg"', 'src="img/crockery/${it.img}.jpg"')
head = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
back = '<p style="margin:0 0 -22px;font:600 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase"><a href="./" style="color:inherit">&larr; Menu, crockery and plating</a></p>'
s = s.replace('<div class="wrap">\n  <header>', '<div class="wrap">\n  ' + back + '\n  <header>', 1)
open(os.path.join(ROOT, 'table-setting.html'), 'w', encoding='utf-8').write(head + s + '</body></html>')
print('wrote table-setting.html')
