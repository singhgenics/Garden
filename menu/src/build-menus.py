#!/usr/bin/env python3
"""Builds food-menu.html and drinks-menu.html: the guest menus with a plated photo beside each dish.
Menu text comes from the live Dream menu (food.html / drinks.html) via menu-data.mjs; photos from img/plating.
Each file is self-contained (photos embedded as small JPEGs), so it can be emailed, printed or opened offline.
Run:  python3 src/build-menus.py   (needs node and Pillow)."""
import base64, html, io, json, os, subprocess, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
menu = json.loads(subprocess.check_output(['node', '-e',
  "import('./menu-data.mjs').then(m=>console.log(JSON.stringify(m.loadMenu())))"], cwd=HERE))
subprocess.run(['python3', 'plating_data.py'], cwd=HERE, check=True)
plating = json.load(open(os.path.join(HERE, 'data.json')))
PL = {p['name'].lower(): p for p in plating}
BYID = {p['id']: p for p in plating}
# drinks that share one photo are shown once, as a strip at the top of their section, instead of repeating it on every line
GROUP = {'paul john brilliance': 'neat', 'amrut fusion': 'neat', 'glenlivet 12': 'neat', 'talisker 10': 'neat',
         "dewar’s white label": 'rocks', "william lawson’s": 'rocks', 'monkey shoulder': 'rocks',
         'johnnie walker black label': 'rocks', 'jameson': 'rocks',
         'haku': 'vodka', 'belvedere': 'vodka', 'house lemongrass-ginger vodka': 'vodka', 'house chilli-garlic vodka': 'vodka'}
LINE_IMGS = {'pitcher or tasting paddle': ['pitcher', 'paddle']}
THUMB = {}
def thumb(pid):
    if pid not in THUMB:
        im = Image.open(os.path.join(ROOT, 'img/plating', pid + '.jpg')).convert('RGB'); im.thumbnail((560, 420))
        b = io.BytesIO(); im.save(b, 'JPEG', quality=80, optimize=True)
        THUMB[pid] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
    return THUMB[pid]
esc = lambda s: html.escape(str(s), quote=True)
def price(p):
    p = str(p); return p if ('₹' in p or p == 'daily') else '₹' + p
def marks(m):
    return {'v': '<i class="mk v" title="Veg"></i>', 'nv': '<i class="mk nv" title="Non-veg"></i>',
            'vn': '<i class="mk v"></i><i class="mk nv"></i>'}.get(m, '')
def badge(b):
    return {'kol': ' <span class="badge kol">Cabin classic</span>', 'goa': ' <span class="badge goa">Konkan touch</span>'}.get(b, '')
def has_vars(it):
    n = it[0].partition('|')[0].lower()
    return n in PL and bool(PL[n].get('vars')) and not LINE_IMGS.get(n)
def item(sec, it, wide=False):
    if sec.get('drink'): n0, ing, how, p, b, h = it[:6]; m = ''
    else: n0, ing, how, p, m, b, h = it[:7]
    n, _, sub = n0.partition('|'); key = n.lower()
    ids = LINE_IMGS.get(key) or ([PL[key]['id']] if key in PL else [])
    if key in GROUP: ids = []
    pic = ''
    pv = PL[key].get('vars') if key in PL and not LINE_IMGS.get(key) else None
    if pv:   # one photo per veg / non-veg option, each with its own label chip
        pic = '<figure class="ph vars v%d">%s</figure>' % (len(pv), ''.join(
            '<div class="tile"><img src="%s" alt="%s, %s, plated" loading="lazy"><span class="chip"><i class="mk %s"></i>%s</span></div>' % (
                thumb(o['img']), esc(PL[key]['name']), esc(o['label']), o['mk'], esc(o['label'])) for o in pv))
    elif ids:
        pic = '<figure class="ph%s">%s</figure>' % (' two' if len(ids) > 1 else '', ''.join('<img src="%s" alt="%s plated" loading="lazy">' % (thumb(i), esc(BYID[i]['name'])) for i in ids))
    heat = '<span class="heat" title="Spice %d of 3">%s</span>' % (h, '•' * h) if h else ''
    return ('<article class="mi%s">%s<div class="tx"><div class="rt"><div class="nm">%s%s%s%s</div><span class="pr">%s</span></div>%s'
            '<p class="ing"><b>In it</b>%s</p><p class="how"><b>How</b>%s</p></div></article>') % (
        (' vn' if pv else ('' if pic else ' nopic')) + (' wide' if wide and not pv else ''), pic, marks(m), esc(n), badge(b), heat, esc(price(p)),
        '<div class="sb">%s</div>' % esc(sub) if sub else '', esc(ing), esc(how))
def single_flags(items):
    # an ordinary dish left alone between two full-width option rows would sit beside a blank cell: let it span the row
    v = [has_vars(i) for i in items]; flags = [False] * len(items); i = 0
    while i < len(items):
        if v[i]: i += 1; continue
        j = i
        while j < len(items) and not v[j]: j += 1
        if j - i == 1 and any(v): flags[i] = True
        i = j
    return flags
def section(sec):
    strip = ''
    gids = []
    for it in sec['items']:
        k = it[0].partition('|')[0].lower()
        if k in GROUP and GROUP[k] not in gids: gids.append(GROUP[k])
    if gids:
        strip = '<div class="strip">%s</div>' % ''.join(
            '<figure><img src="%s" alt="%s"><figcaption>%s<small>%s</small></figcaption></figure>' % (thumb(g), esc(BYID[g]['name']), esc(BYID[g]['name']), esc(BYID[g]['sub'])) for g in gids)
    return '<section class="sec%s" id="s-%s"><h2>%s</h2><p class="kick">%s</p>%s<div class="items">%s</div></section>' % (
        ' sets' if sec.get('sets') else '', sec['id'], esc(sec['t'].lower()), esc(sec['k']), strip, ''.join(item(sec, i, w) for i, w in zip(sec['items'], single_flags(sec['items']))))
CSS = open(os.path.join(HERE, 'menus.css')).read()
BRAND = json.load(open(os.path.join(HERE, 'brand-snippets.json')))
def page(kind):
    secs = menu[kind]
    food = kind == 'food'
    title = 'Food' if food else 'Drinks'
    tag = 'Food menu · Pan-Asian · cabin-style Chinese · dim sum &amp; bao · Thai, Burmese &amp; Korean' if food else 'Drinks menu · craft taps &amp; bottled beer · whisky &amp; vodka · cocktails · zero proof · coffee'
    lede = ('Pan-Asian, pub-style. Indo-Chinese from a full-flame wok: high flame, double-fried, extra chilli. Hand-folded dim sum and soft bao. And a short run from Seoul to Bangkok: Korean wings, Thai curries and a Burmese khao suey. On most dishes you pick the protein. A few borrow from the Konkan pantry around us.'
            if food else 'Three craft taps brewed up the coast, plus Kings and Budweiser by the bottle. Single malts, blended Scotch and an Irish whiskey, four vodkas, eight cocktails built around feni, kokum, soju and lemongrass, fresh zero-proof coolers and brewed coffee, poured at the bar all day.')
    legend = ('<span><i class="mk v"></i>Veg</span><span><i class="mk nv"></i>Non-veg</span><span><i class="mk v"></i><i class="mk nv"></i>Pick veg or non-veg (prices from ₹)</span>' if food else '') + \
             '<span><span class="badge kol">Cabin classic</span> One of our wok classics</span><span><span class="badge goa">Konkan touch</span> Made with something from our own coast</span>' + \
             ('<span><b class="heat">••</b> Spice, one to three</span>' if food else '')
    note = ('<span>Prices in ₹, taxes extra. Dim sum come 4 to a basket, bao 2 to a plate.</span><span>Tell us about allergies: shellfish, pork, peanuts, gluten, egg, soy, sesame.</span><span>Drinks are on the drinks menu.</span>' if food else
            '<span>Prices in ₹, taxes extra. Spirits are poured in 30 ml / 60 ml.</span><span>Happy hour 12–6 pm daily: 330 ml taps ₹179 · Kings 330 ml ₹99. The guest tap changes every couple of weeks.</span><span>Please drink responsibly. Alcohol is served only to guests aged 21 and over.</span><span>Food is on the food menu.</span>')
    other = 'drinks-menu.html' if food else 'food-menu.html'
    n = sum(len(s['items']) for s in secs)
    return ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
      '<title>Cabin East · %s menu with photos</title><meta name="theme-color" content="#F3E9D2">'
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=Alfa+Slab+One&display=swap">'
      '<style>%s</style></head><body><div class="wrap"><header class="hd"><p class="eyebrow">Betalbatim · a short walk from the Arabian Sea · Wok | Steam | Draught</p>'
      '<h1>' + BRAND['wordmark'] + '</h1>' + BRAND['signs'] + '<p class="tag">%s</p><p class="lede">%s</p>'
      '<nav class="sw" aria-label="Menus"><a href="food-menu.html"%s>Food</a><a href="drinks-menu.html"%s>Drinks</a></nav></header>'
      '<div class="legend">%s</div><nav class="jump">%s</nav><main>%s</main><footer class="mf">%s</footer></div></body></html>') % (
      title, CSS, tag, lede, ' aria-current="page"' if food else '', '' if food else ' aria-current="page"', legend,
      ''.join('<a href="#s-%s">%s</a>' % (s['id'], esc(s['t'])) for s in secs), ''.join(section(s) for s in secs), note), n
for kind, fn in (('food', 'food-menu.html'), ('drinks', 'drinks-menu.html')):
    out, n = page(kind); open(os.path.join(ROOT, fn), 'w').write(out)
    print('%s: %d lines, %.0f KB' % (fn, n, len(out) / 1024))
