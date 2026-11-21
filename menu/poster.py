# Builds the poster-style menu (poster-menu.html + poster-menu.pdf): four A3 faces laid out like the reference menus
# (big logo, hero photo cut-out on a sun disc, brush-stroke section tags, ruled item rows, framed strip at the bottom).
# Dish text, prices, veg marks, spice and allergens all come from build.py (single source of truth), so edit dishes there.
# Photos: cut/*.png are realistic photos cut out from a flat cyan background (see cutout.sh).
# Export: python3 poster.py, then
#   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf=poster-menu.pdf file://$PWD/poster-menu.html
import re,base64,random,io,contextlib
with contextlib.redirect_stdout(io.StringIO()):
    import build as B
IT=B.ITEMS

def item(name,note=''):
    d,p=IT[name]
    single=B.single(p)
    price=f'<b class="pc">{p}</b>' if single else ''
    var='' if single else B.pr(p)
    return (f'<div class="it"><div class="hd"><span class="nm">{B.MK[B.VEG.get(name,"")]}{name}</span>{price}</div>'
            f'<p class="ds">{d}</p>{var}{B.meta(name)}</div>')
def sec(title,label,names,extra=''):
    return f'<div class="sec"><div class="sh"><h2>{title}</h2><small>{label}</small></div>'+''.join(item(n) for n in names)+extra+'</div>'
def cut(img,cap='',cls=''):
    # cls 'mul': a photo shot on the cream paper colour, blended in with multiply (for glassware, where a cut-out would leave holes)
    sun='' if cls=='mul' else '<i class="sun"></i>'
    ext='jpg' if cls=='mul' else 'png'
    return f'<div class="feat {cls}">{sun}<img src="cut/{img}.{ext}" alt="">{f"<b>{cap}</b>" if cap else ""}</div>'
def strip(cells):
    out=''
    for img,t,pr,txt in cells:
        out+=f'<div class="cell"><img src="cut/{img}.png" alt=""><div><strong>{t}</strong><b>{pr}</b><span>{txt}</span></div></div>'
    return f'<div class="strip">{out}</div>'
def page(hero,L,R,foot,cls=''):
    m=len(hero)>2
    sun='' if m else '<i class="sun"></i>'
    ext='jpg' if m else 'png'
    heroh='<div class="hero '+('mul' if m else '')+'">'+sun+'<img src="cut/'+hero[0]+'.'+ext+'" alt=""><em>'+hero[1]+'</em></div>'
    return (f'<section class="pg {cls}"><div class="sp"></div><header><img class="logo" src="logo/B-lockup-tight.svg" alt="Konso · Pan Asian Kitchen | Bar">'
            f'</header>'
            +heroh+
            f'<div class="L">{L}</div><div class="R">{R}</div>{foot}'
            +('<p class="legal"><i class="m v"></i> veg &nbsp; <i class="m n"></i> non-veg &nbsp;·&nbsp; Spice: • mild, •• hot &nbsp;·&nbsp; Prices in rupees, taxes extra &nbsp;·&nbsp; Please tell us about any allergy before you order</p>' if 'food' in cls else
              '<p class="legal">Prices in rupees, taxes extra &nbsp;·&nbsp; Alcohol is served only to guests aged 21 and over &nbsp;·&nbsp; Please drink responsibly &nbsp;·&nbsp; Ask us about allergens</p>')+'</section>')

# ---- the four faces (drinks first, then food; sweets close the food menu, Zero Proof closes the drinks menu) ----
KF=('<div class="kf"><div class="hd"><span class="nm"><i class="m v"></i><i class="m n"></i>Konso Fever</span></div>'
    '<p class="ds">Double-fried, then tossed on full flame so the green chilli sauce catches and smokes.</p>'
    '<div class="vars"><span>Paneer <b>280</b></span><span>Chicken <b>320</b></span><span>Pork belly <b>360</b></span></div>'+B.meta('Konso Fever')+'</div>')
P1=page(('dimsum','Dim sum, hand-folded'),
  sec('Dim Sum','hand-folded · 4 to a basket',['Crystal Clear','Siu Mai Goodness','Fire Starters','Prawn to Be Wild'])+
  sec('Bao','soft buns · 2 to a plate',['Bao Down','Seoul Mate','Fever Pitch'])+
  sec('Soups &amp; Salads','light, sharp, cold',['Smash Hit','Hot & Bothered','Wonton Kenobi','Coconut Cuddle','Slap Happy']),
  sec('From the Wok','high flame',['Honey Trap','Fry Hard','Wonton More','Salt & Pepa','K-Pop Wings'],KF)+cut('bao'),
  strip([('siumai','Steamer for two','799','2 baskets of dim sum and a plate of bao, our pick of the day.'),
         ('noodle','Bowl Game','12–4','Lunch: any noodles or fried rice + Konso Fever chicken 440, paneer 380, or green curry and rice 360.'),
         ('fever','Feast for four','2,299','4 soups, Konso Fever chicken, Salt &amp; Pepa chonak, mixed Noodle Around, Green With Envy with rice, darsaan.')]),'food p1 cmp')
P2=page(('dessert','Something sweet'),
  sec('Mains','thai · burmese · street-style',['Noodle Around','Rice Rice Baby','Gravy Train','Sweet Talk','Green With Envy','Holy Basil, Batman!','Suey Generis','Plain Jane']),
  sec('Something Sweet','end on a high',['Honey, I Shrunk the Noodles','Sticky Situation','Scoop There It Is','Brewed Coffee','Irish Coffee'])+cut('sticky'),
  '<div class="strip one"><div class="cell wide"><img src="logo/B-monogram-gold.svg" class="mono" alt=""><div><strong>Allergies?</strong><span>Please tell us before you order. Prices in rupees, taxes extra. <i class="m v"></i> veg <i class="m n"></i> non-veg. Spice • to •••. Our kitchen also handles shellfish, peanuts, gluten, egg, soy and milk.</span></div></div></div>','food p2')
P3=page(('cocktail','Cold bottles and Konkan cocktails'),
  sec('Beer','cold bottles · craft from up the coast',['Kings','Budweiser','Corona Extra','Hoegaarden','Comrade Crisp','Gose Bumps','Eight Finger Eddie IPA','Vanilla Porter','Bucket of Five']),
  sec('Cocktails','feni · kokum · soju · lemongrass',['Kokum Feni Sour','Pink Panchayat','Tingle All The Way','Yak Attack','Kimchi Mary','Lychee Lemon-Gras','Tam-Tam Margarita','Somaek Bomb']),
  '<div class="strip two"><div class="cell"><div class="hhc"><strong>Happy hour 12 to 6</strong><span>Kings 330 ml <b>99</b> <s>120</s></span><span>Budweiser 330 ml <b>149</b> <s>180</s></span></div></div><div class="cell"><div><strong>Please drink responsibly</strong><span>Alcohol is served only to guests aged 21 and over. Prices in rupees, taxes extra.</span></div></div></div>','drinks')
P4=page(('zero','Pressed and brewed in house','mul'),
  sec('Vodka','infused in house · 30 / 60 ml',['Lemongrass-Ginger Vodka','Chilli-Garlic Vodka','Clear Conscience'])+
  sec('Whisky','30 / 60 ml',['The Gateway','Irish Eyes','Made in Cuncolim','Easy Does It','Toki Time','Bonfire Night','The Flight'])+cut('whisky','','mul'),
  sec('Wine','glass / bottle',['Bubbles','Crisp White','Pink','Easy Red','Sangria Jug'])+
  sec('Zero Proof','pressed and brewed in house',['Fresh Lime Soda','Kokum Soda','Lemongrass-Ginger Iced Tea','Tonic or Ginger Ale','Soft Drinks','Water']),
  '<div class="strip one"><div class="cell wide"><img src="logo/B-monogram-gold.svg" class="mono" alt=""><div><strong>Thank you for dining with us</strong><span>Allergens are listed from our recipes; please ask us about any allergy. Prices in rupees, taxes extra.</span></div></div></div>','drinks p4 cmp')

CSS=r'''
@font-face{font-family:Prata;src:url(fonts/Prata-Regular.ttf)}
@font-face{font-family:Mont;src:url(fonts/Montserrat.ttf);font-weight:100 800}
@font-face{font-family:MontM;src:url(fonts/Montserrat-Medium.ttf)}
:root{--g:#1F3D2E;--ink:#12261B;--paper:#F7EFDC;--gold:#C49A3C;--bgreen:@BG}
*{box-sizing:border-box}html,body{margin:0;background:#2a2a2a}
body{font:15px/1.35 Mont,system-ui,sans-serif;color:var(--ink)}
.wrap{margin:0 auto 18px;width:calc(1123px*var(--s,1));height:calc(1587px*var(--s,1))}
.pg{width:1123px;height:1587px;position:relative;overflow:hidden;background:@SPK var(--paper);transform:scale(var(--s,1));transform-origin:0 0}
.sp{position:absolute;inset:0;background:@SPL no-repeat;opacity:.0}
header{position:absolute;left:40px;top:30px;width:540px}
.logo{width:440px;display:block}
.seal{position:absolute;left:392px;top:178px;width:50px;height:50px;border-radius:50%;background:var(--g);outline:1.5px solid var(--gold);outline-offset:-5px;padding:12px 9px}
.seal img{width:100%;display:block}
.gfgm{position:absolute;left:4px;top:236px;font:600 12.5px/1.2 Mont;letter-spacing:.28em;text-transform:uppercase;color:var(--g);white-space:nowrap}
.hero{position:absolute;right:22px;top:8px;width:570px;height:470px}
.hero .sun,.feat .sun{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 30%,#EBB85B,#D9A13F 60%,#C08A2C);z-index:0}
.hero .sun{width:430px;height:430px;right:70px;top:26px}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:1;filter:drop-shadow(0 14px 14px #0005)}
.hero em{position:absolute;left:36px;bottom:8px;z-index:2;font:italic 400 17px Prata,serif;color:var(--g);background:var(--paper);padding:2px 12px;border-radius:2px;display:none}
.L{position:absolute;left:40px;top:270px;bottom:196px;width:482px;display:flex;flex-direction:column;justify-content:space-between}
.R{position:absolute;left:560px;right:40px;top:490px;bottom:196px;display:flex;flex-direction:column;justify-content:space-between}
.sec{display:flex;flex-direction:column;flex:1 0 auto}.sec .it{flex:1 0 auto}.p1 .L{top:242px;bottom:146px}.p1 .nm,.p1 .pc{font-size:18px}.p1 .ds{font-size:12.8px}.p1 .strip{height:108px}.p1 .cell img{width:66px;height:66px}.p1 .cell{padding:6px 14px}.p1 .it{padding:1px 0}.p1 .sh{margin-bottom:2px}.p1 .strip{margin-bottom:-2px}.p1 .ds{line-height:1.22}.p1 .sh h2{font-size:26px}.p1 .sh{margin-bottom:3px}.p1 .strip strong{font-size:19px}.p1 .cell span{font-size:12.5px}.legal{position:absolute;left:40px;right:40px;bottom:9px;margin:0;text-align:center;font:600 11.5px/1.2 Mont;color:#2c3a31;letter-spacing:.02em}.kf{flex:none}.mul img{mix-blend-mode:multiply;filter:none!important}.sh{flex:none}
.sh{display:flex;align-items:center;gap:14px;margin:0 0 6px}
.sh h2{margin:0 0 0 -10px;font:400 36px/1.02 Prata,serif;letter-spacing:.03em;text-transform:uppercase;color:#F4E3AE;background:var(--bgreen) 0 0/100% 100% no-repeat;padding:.22em 1.7em .3em .7em;white-space:nowrap}
.sh small{max-width:170px;font:700 12.5px/1.25 Mont;letter-spacing:.14em;text-transform:uppercase;color:var(--g)}
.it{border-top:1.2px solid #1F3D2E40;padding:6px 0 6px}.sh+.it{border-top:1.2px solid #1F3D2E40}
.hd{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.nm{font:400 21px/1.2 Prata,serif;color:var(--ink)}.pc{font:400 21px Prata,serif;color:var(--ink)}
.ds{margin:2px 0 0;font-size:13.8px;line-height:1.32;color:#26352b}
.pr{margin-top:3px;font-size:14px;display:flex;flex-wrap:wrap;gap:0 8px}.pr b{font:600 15px MontM,sans-serif;color:var(--g)}.pr i{font-style:normal;opacity:.4}.pr .o{font-weight:500}.pr span{display:inline}
.meta{margin-top:2px;font-size:11.8px;color:#3b4a40;display:flex;gap:2px 10px;flex-wrap:wrap}.heat{font-weight:700;color:#7a5c14}
.m{display:inline-block;width:12px;height:12px;border:1.5px solid;margin-right:7px;position:relative;vertical-align:1px;background:#fff8}
.m::after{content:"";position:absolute;inset:2px;border-radius:50%;background:currentColor}.m.v{color:#2e8b3d}.m.n{color:#c2271d;margin-left:-3px}
.feat{position:relative;flex:1 0 170px;margin-top:10px}
.feat .sun{width:min(100%,260px);aspect-ratio:1;right:6%;top:50%;transform:translateY(-52%)}
.feat img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:1;filter:drop-shadow(0 10px 10px #0005)}
.kf{border-top:1.2px solid #1F3D2E40;padding:6px 0}.kf .nm{font-size:23px}
.vars{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 3px}.vars span{background:var(--g);color:#F4E3AE;border-radius:99px;padding:4px 13px;font-size:14px}.vars b{font:700 15px MontM;color:#fff;margin-left:5px}
.hh{border:2px solid var(--g);outline:1px solid var(--g);outline-offset:3px;padding:8px 14px;margin:4px 4px 10px;display:flex;flex-wrap:wrap;gap:2px 18px;align-items:baseline}
.hh strong{font:400 22px Prata,serif;color:var(--g);width:100%}.hh span{font-size:15px}.hh b{font:700 19px MontM;color:var(--g);margin:0 3px}.hh s{opacity:.55}
.strip{position:absolute;left:40px;right:40px;bottom:34px;height:146px;border:2.5px solid var(--g);outline:1px solid var(--g);outline-offset:4px;border-radius:3px;display:grid;grid-template-columns:repeat(3,1fr);background:var(--paper);z-index:3}
.strip.one{grid-template-columns:1fr;height:100px}
.strip::before,.strip::after{content:"";position:absolute;width:13px;height:13px;background:var(--g);top:-9px;left:-9px;box-shadow:calc(100% + 0px) 0 0 0 transparent}
.strip::after{left:auto;right:-9px;top:auto;bottom:-9px}
.cell{display:flex;align-items:center;gap:12px;padding:10px 16px;border-left:1.5px solid #1F3D2E50}.cell:first-child{border:0}
.cell img{width:86px;height:86px;object-fit:contain;flex:none;filter:drop-shadow(0 4px 4px #0004)}.cell img.mono{filter:none;background:var(--g);border-radius:50%;padding:12px 10px}
.cell strong{display:inline-block;font:400 21px/1.1 Prata,serif;color:var(--g)}.cell b{font:700 22px MontM;color:var(--g);margin-left:8px}.cell span{display:block;font-size:13px;line-height:1.3;margin-top:3px}
.cell.wide{padding:10px 26px}
.drinks .it{padding:4px 0}.drinks .nm,.drinks .pc{font-size:19.5px}.drinks .ds{font-size:13.4px;line-height:1.28}.drinks .sh h2{font-size:33px}
.p4 .hero,.p1 .hero{height:360px;width:540px}.p4 .hero .sun,.p1 .hero .sun{width:320px;height:320px;top:18px;right:60px}.p4 .R,.p1 .R{top:385px}.cmp .it{padding:3px 0}.cmp .nm,.cmp .pc{font-size:18.5px}.cmp .ds{font-size:13px;line-height:1.26}.cmp .sh h2{font-size:31px}.cmp .meta{font-size:11.5px}.cmp .kf .nm{font-size:20px}
.strip.two{grid-template-columns:1.25fr 1fr;height:100px}.strip .hhc{display:block}.strip .hhc strong{display:block;margin-bottom:2px}.strip .hhc span{display:inline-block;margin-right:12px}.strip .hhc b{font-size:20px;margin:0 3px}.strip .hhc s{opacity:.55}
.top{position:sticky;top:0;z-index:9;background:#1F3D2E;color:#F4E3AE;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;padding:9px 12px;font:600 13px/1.3 Mont,sans-serif;margin-bottom:12px}.top a{color:#12261B;background:#E7C468;text-decoration:none;border-radius:99px;padding:5px 13px}.top a.ph{background:#F7EFDC}
html{scroll-padding-top:56px}
@page{size:A3;margin:0}
@media print{.top{display:none}html,body{background:#fff}.wrap{margin:0;width:1123px;height:1587px;break-after:page}.pg{transform:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
'''
CSS=CSS.replace('@BG',B.BR_GREEN).replace('@SPK',B.SPK+' 0 0/100% 100% no-repeat,').replace('@SPL',B.SPL)
JS="<script>if(innerWidth<700&&location.search.indexOf('poster')<0)location.replace('../');function f(){var s=Math.min(1,(innerWidth-16)/1123);document.documentElement.style.setProperty('--s',s)}f();addEventListener('resize',f);matchMedia('print').addEventListener&&0</script>"
BAR='<nav class="top"><span>Konso menu · poster version for printing and big screens</span><a href="#drinks">Drinks</a><a href="#food">Food</a><a class="ph" href="../">Easy phone menu (veg filter)</a></nav>'
html=f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Konso · Poster menu</title><style>{CSS}</style></head><body>'+BAR+''.join(f'<div class="wrap"{i}>{p}</div>' for p,i in ((P3," id=drinks"),(P4,""),(P1," id=food"),(P2,"")))+JS+'</body></html>'
def b64(p,mime): return f'data:{mime};base64,'+base64.b64encode(open(p,'rb').read()).decode()
html=re.sub(r'src="((?:cut)/[^"]+\.png)"',lambda m:'src="'+b64(m.group(1),'image/png')+'"',html)
html=re.sub(r'src="((?:cut)/[^"]+\.jpg)"',lambda m:'src="'+b64(m.group(1),'image/jpeg')+'"',html)
html=re.sub(r'src="(logo/[^"]+\.svg)"',lambda m:'src="'+b64(m.group(1),'image/svg+xml')+'"',html)
html=re.sub(r'url\((fonts/[^)]+\.ttf)\)',lambda m:'url('+b64(m.group(1),'font/ttf')+')',html)
open('poster-menu.html','w',encoding='utf-8').write(html)
print('wrote poster-menu.html',len(html)//1024,'KB')
