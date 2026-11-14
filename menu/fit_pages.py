# Measures each print page's natural height and writes pageheights.json so build.py can size every PDF page to its content.
# Usage: python3 fit_pages.py && python3 build.py   (needs Playwright with Chrome)
import json,os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(channel='chrome')
    pg=b.new_page(viewport={'width':1200,'height':1600});pg.emulate_media(media='print')
    pg.goto('file://'+os.path.abspath('index.html'));pg.wait_for_timeout(2500)
    pg.add_style_tag(content='.sec{height:auto!important;min-height:0!important}')
    pg.wait_for_timeout(500)
    h={k:int(v)+2 for k,v in pg.evaluate("Object.fromEntries([...document.querySelectorAll('.sec')].map(s=>[s.id,Math.ceil(s.getBoundingClientRect().height)]))").items()}
    json.dump(h,open('pageheights.json','w'));print(h)
    b.close()
