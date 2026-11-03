# Builds the picture menu (index.html), engineered per MENU-ENGINEERING.md.
# Prices copied from Dream/menu/food.html and drinks.html. No currency symbols on purpose.
MK={'v':'<i class="m v" title="Veg"></i>','nv':'<i class="m n" title="Non-veg"></i>','vn':'<i class="m v" title="Veg"></i><i class="m n" title="Non-veg"></i>','':''}

def card(img,name,sub,price,tag='',vn='',span=4,ar=''):
    t=f'<b class="tag">{tag}</b>' if tag else ''
    a=f' style="--ar:{ar}"' if ar else ''
    return (f'<figure class="card s{span}"><div class="ph"{a}><img src="img/{img}.jpg" alt="{name}">{t}</div>'
            f'<figcaption><h3>{MK[vn]}{name}</h3><span class="p">{price}</span><p>{sub}</p></figcaption></figure>')

def rows(items,cols=2):
    return f'<div class="more c{cols}">'+''.join(f'<div><span><b>{n}</b>{(" · "+d) if d else ""}</span><em>{p}</em></div>' for n,d,p in items)+'</div>'

def sh(title,small,lede='',sub=False):
    l=f'<p class="lede">{lede}</p>' if lede else ''
    return f'<div class="sh{" sub" if sub else ""}"><h2>{title}</h2><small>{small}</small></div>{l}'

# 1. Dim sum + bao: the signature. Highest-margin item (siu mai) first and biggest; prawn (dearest) last as the price anchor.
dim=''.join([
 card('siumai','Siu Mai Goodness','Chouriço and chicken, open-topped, with a kick of chilli oil','300','Signature · Konkan touch','nv',7,'7/5'),
 card('crystal','Crystal Clear','Water chestnut, carrot and edamame in a glass-clear skin','220','Veg favourite','v',5,'1/1'),
 card('firestarters','Fire Starters','Chicken wontons drowned in house chilli oil and black vinegar','280','Chef’s pick','nv',5,'1/1'),
 card('prawndump','Prawn to Be Wild','Plump prawn and garlic-chive dumplings, chilli-soy on the side','340','','nv',7,'7/5')])
bao=''.join([
 card('baodown','Bao Down','Pork belly braised 3 hours, hoisin, cucumber, peanut crumb','320','Signature','nv',4,'4/3'),
 card('feverpitch','Fever Pitch','Our Cabin Fever chicken, pickled onion, chilli mayo','280','','nv',4,'4/3'),
 card('seoulmate','Seoul Mate','Charred paneer, gochujang glaze, sesame','260','','v',4,'4/3')])

# 2. Wok: Cabin Fever is the hero (bestseller), top of the page.
hero='''<figure class="hero"><div class="ph"><img src="img/cabinfever.jpg" alt="Cabin Fever"><b class="tag burg">Bestseller</b></div>
<figcaption><small>Our wok classic</small><h3><i class="m v"></i><i class="m n"></i>Cabin Fever</h3>
<p>Double-fried, then tossed on full flame so the sauce catches and smokes. Green chilli, onion, capsicum, garlic.</p>
<ul><li><span>Paneer</span><b>280</b></li><li><span>Chicken</span><b>320</b></li><li><span>Pork belly</span><b>360</b></li></ul>
<div class="pair">Pair it with a pint of <b>Gose Bumps</b> · 260</div></figcaption></figure>'''
wok=''.join([
 card('kpop','K-Pop Wings','Glass-crisp Korean wings, 6 pc, soy-garlic or gochujang','380','','nv',3,'1/1'),
 card('honeytrap','Honey Trap','Sticky honey-chilli glaze. Potato 220 · chicken 320','220','Dangerous with beer','vn',3,'1/1'),
 card('saltpepa','Salt & Pepa','Salt, pepper, fried garlic. Mushroom 260 · chonak 420 · prawns 460','260','','vn',3,'1/1'),
 card('fryhard','Fry Hard','Kimchi fries, melted cheese, gochujang mayo','240','Try this','v',3,'1/1')])
wokmore=rows([('Wonton More','crisp fried wontons, sweet chilli · veg / chicken','240 / 260'),
 ('Slap Happy','raw papaya salad, pounded to order','240'),
 ('Wonton Kenobi','chicken wonton soup','220'),
 ('Smash Hit','smashed cucumber, chilli oil','160'),
 ('Hot & Bothered','hot & sour · veg / chicken','180 / 210'),
 ('Coconut Cuddle','tom kha · veg / chicken','220 / 250')])

# 3. Mains
mains=''.join([
 card('greencurry','Green With Envy','Thai green curry, paste pounded in house. Veg 300 · chicken 340 · prawn 440','300','','vn',6,'3/2'),
 card('khaosuey','Suey Generis','Burmese khao suey, build it with the toppings. Veg 320 · chicken 360','320','','vn',6,'3/2'),
 card('holybasil','Holy Basil, Batman!','Thai basil chicken, runny fried egg, rice','320','','nv',4,'4/3'),
 card('noodlearound','Noodle Around','Street-style hakka noodles. Veg 240 · chicken 280 · mixed 340','240','','vn',4,'4/3'),
 card('ricebaby','Rice Rice Baby','Burnt-garlic fried rice. Veg 240 · chicken 280 · mixed 320','240','','vn',4,'4/3')])
mainsmore=rows([('Man, Churian!','Manchurian gravy · veg / chicken','260 / 300'),('Plain Jane','steamed jasmine rice, for the curries','120')])

# 4. Sweet + tap
sweet=''.join([
 card('darsaan','Honey, I Shrunk the Noodles','Crisp fried noodles tossed in hot honey, with vanilla ice cream','220','Our dessert','v',6,'3/2'),
 card('sticky','Sticky Situation','Coconut sticky rice, palm jaggery, sesame, ice cream','220','','v',6,'3/2')])
taps=''.join([
 card('crisp','Comrade Crisp','People’s Lager, the beach beer. Pint / 500 ml','220 / 300','','',4,'4/5'),
 card('gose','Gose Bumps','Kokum gose, tart, salty, pink. Try this first. Pint / 500 ml','260 / 350','Konkan touch','',4,'4/5'),
 card('paddle','Tasting paddle','3 × 150 ml of every tap. Pitcher of Comrade Crisp 850','320','Best way to start','',4,'4/5')])
tapmore=rows([('Kings','premium pilsner, 330 / 650 ml','120 / 180'),('Budweiser','330 / 650 ml','180 / 260'),('Guest tap','changes every couple of weeks','260 / 360'),('Scoop There It Is','ice cream, 2 scoops + 1 topping','150')])

# 5. Cocktails
cock=''.join([
 card('kokumsour','Kokum feni sour','Cashew feni, kokum, lime, silky foam','420','Konkan touch','',3,'3/4'),
 card('coconuthigh','Coconut feni highball','Coconut feni, lemongrass syrup, soda','380','Konkan touch','',3,'3/4'),
 card('margarita','Tamarind chilli margarita','Agave, tamarind, lime, chilli-salt rim','460','','',3,'3/4'),
 card('kimchimary','Kimchi Mary','Vodka, tomato, kimchi brine, gochugaru rim','420','','',3,'3/4')])
cockmore=rows([('Lychee & lemongrass martini','','440'),('Sichuan G&T','','420'),('Soju Yakult','','420'),('Somaek','soju dropped in a cold lager','360'),('Irish coffee','','360'),('Brewed coffee','','120 / 140')])
zero=''.join([
 card('kokumsoda','Kokum soda','Kokum, black salt, soda','140','','',4,'4/3'),
 card('limesoda','Fresh lime soda','Sweet or salted','120','','',4,'4/3'),
 card('icedtea','Lemongrass-ginger iced tea','Brewed in house','160','','',4,'4/3')])
spirits=rows([('Paul John Brilliance','Indian single malt','320 / 600'),('Glenlivet 12','','420 / 800'),('Talisker 10','','520 / 1,000'),('Dewar’s White Label','','200 / 380'),('Jameson','','280 / 520'),('Suntory Toki highball','','420'),('Single malt flight','3 × 20 ml','650'),('House infused vodkas','','240 / 440')])

css='''
@font-face{font-family:Alfa;src:url(fonts/AlfaSlabOne-Regular.ttf)}
@font-face{font-family:Plex;src:url(fonts/IBMPlexSans.ttf);font-weight:100 700}
@font-face{font-family:PlexMono;src:url(fonts/IBMPlexMono-Medium.ttf)}
:root{--green:#1F3D2E;--ink:#1D2A22;--cream:#F2E8D2;--paper:#FBF4E4;--brass:#C49A3C;--burg:#6A1622;--bou:#D81B7A;--mut:#5b4d40}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ink);color:var(--cream);font:17px/1.45 Plex,system-ui,sans-serif}
.sec{padding:56px 0 64px}.in{max-width:1100px;margin:0 auto;padding:0 24px}
.dark{background:var(--green);color:var(--cream)}.cream{background:var(--cream);color:var(--ink)}.wine{background:var(--burg);color:var(--cream)}
nav{position:sticky;top:0;z-index:5;background:var(--ink);display:flex;gap:8px;overflow-x:auto;padding:10px 16px;justify-content:center}
nav a{flex:none;color:var(--cream);text-decoration:none;font:12px PlexMono,monospace;letter-spacing:.14em;text-transform:uppercase;padding:8px 14px;border:1px solid #f2e8d255;border-radius:99px}
nav a:hover{background:var(--brass);color:var(--ink);border-color:var(--brass)}
.sh{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 18px;border-bottom:2px solid var(--brass);padding-bottom:10px;margin:0 0 12px}
.sh h2{margin:0;font:clamp(36px,7vw,66px)/1 Alfa,Georgia,serif;text-transform:uppercase;letter-spacing:.01em;font-weight:400}
.sh small{font:13px PlexMono,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--brass)}
.cream .sh small{color:var(--burg)}.cream .sh{border-color:var(--burg)}
.sh.sub{margin-top:52px}
.lede{margin:0 0 22px;font-size:18px;opacity:.85;max-width:60ch}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:20px 18px;margin-top:22px}
.s3{grid-column:span 3}.s4{grid-column:span 4}.s5{grid-column:span 5}.s6{grid-column:span 6}.s7{grid-column:span 7}
.card,.hero{margin:0}
.ph{position:relative;aspect-ratio:var(--ar,4/3);overflow:hidden;border-radius:16px;background:#0003;outline:2px solid #c49a3c66;outline-offset:-2px}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.tag{position:absolute;left:12px;top:12px;background:var(--brass);color:var(--ink);font:11px/1 PlexMono,monospace;letter-spacing:.12em;text-transform:uppercase;padding:7px 11px;border-radius:99px}
.tag.burg{background:var(--burg);color:var(--cream)}
figcaption{padding:12px 2px 0;display:grid;grid-template-columns:1fr auto;gap:2px 14px;align-items:baseline}
h3{margin:0;font:600 23px/1.15 Plex,sans-serif;letter-spacing:-.005em}
.p{font:600 24px/1 PlexMono,monospace;color:var(--brass)}
.cream .p{color:var(--burg)}
figcaption p{grid-column:1/-1;margin:3px 0 0;font-size:15px;opacity:.82}
.s3 h3,.s4 h3{font-size:20px}.s3 .p,.s4 .p{font-size:19px}.s3 figcaption p,.s4 figcaption p{font-size:14px}
.s7 h3,.s6 h3{font-size:27px}
.m{display:inline-block;width:12px;height:12px;border:1.5px solid;margin-right:7px;position:relative;vertical-align:1px;background:var(--paper)}
.m::after{content:"";position:absolute;inset:2px;border-radius:50%;background:currentColor}
.m.v{color:#2e8b3d}.m.n{color:#c2271d;margin-left:-3px}
.hero{display:grid;grid-template-columns:1.35fr 1fr;border-radius:20px;overflow:hidden;background:var(--burg);color:var(--cream)}
.hero .ph{aspect-ratio:auto;min-height:400px;border-radius:0;outline:0}
.hero figcaption{display:block;padding:30px 30px 26px;align-self:center}
.hero small{font:12px PlexMono,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--brass)}
.hero h3{font:clamp(34px,5vw,50px)/1.02 Alfa,Georgia,serif;margin:8px 0 12px;font-weight:400}
.hero p{font-size:16px;opacity:.9;margin:0 0 14px}
.hero ul{list-style:none;margin:0 0 16px;padding:0}.hero li{display:flex;justify-content:space-between;border-bottom:1px dotted #f2e8d266;padding:7px 0;font-size:18px}.hero li b{font:600 22px PlexMono,monospace;color:var(--brass)}
.pair{background:#0003;border-left:3px solid var(--brass);padding:9px 12px;font-size:14.5px}.pair b{color:var(--brass)}
.band{border:2px solid var(--brass);border-radius:16px;padding:18px 24px;margin-top:30px;display:flex;flex-wrap:wrap;gap:6px 26px;justify-content:space-between;align-items:center}
.band strong{font:26px Alfa,Georgia,serif;color:var(--brass);font-weight:400}.cream .band{border-color:var(--burg)}.cream .band strong{color:var(--burg)}
.band span{font-size:16px;max-width:56ch}
.band .big{font:46px/1 PlexMono,monospace;color:var(--brass);font-weight:600}
.more{margin-top:26px;display:grid;column-gap:44px}.c2{grid-template-columns:1fr 1fr}
.more div{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #c49a3c55;padding:9px 0;font-size:16px}
.more b{font-weight:600}.more em{font-style:normal;font:600 17px PlexMono,monospace;color:var(--brass);white-space:nowrap}.cream .more em{color:var(--burg)}
.foot{margin-top:40px;font-size:13.5px;opacity:.75;border-top:1px solid #c49a3c66;padding-top:14px}
@media screen and (max-width:820px){.s3{grid-column:span 6}.s4,.s5,.s6,.s7{grid-column:span 12}.hero{grid-template-columns:1fr}.hero .ph{min-height:0;aspect-ratio:4/3}.c2{grid-template-columns:1fr}.s7 .ph,.s5 .ph{aspect-ratio:4/3}}
@media screen and (max-width:560px){.s3{grid-column:span 12}.s3 .ph{aspect-ratio:4/3}.in{padding:0 16px}.band .big{font-size:36px}}
@page{size:1200px 1900px;margin:0}
@media print{
 body{width:1200px;-webkit-print-color-adjust:exact;print-color-adjust:exact}nav{display:none}
 .sec{break-before:page;height:1900px;overflow:hidden;padding:50px 0}.sec.pg1{break-before:auto}
 .in{max-width:none;padding:0 56px}
 .card,.hero,.band{break-inside:avoid}
 #dimsum .s7 .ph{aspect-ratio:7/4.4!important}#dimsum .s5 .ph{aspect-ratio:5/4.4!important}
 #wok .hero .ph{min-height:560px}#wok .s3 .ph{aspect-ratio:4/5!important}#wok .more{margin-top:40px}
 #mains .s6 .ph{aspect-ratio:4/3!important}#mains .s4 .ph{aspect-ratio:1/1!important}
 #sweet .s6 .ph{aspect-ratio:1/1!important}#sweet .s4 .ph{aspect-ratio:3/4!important}
}
'''

html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cabin East · Picture menu</title><style>{css}</style></head><body>
<nav><a href="#dimsum">Dim sum &amp; bao</a><a href="#wok">Wok</a><a href="#mains">Mains</a><a href="#sweet">Sweet &amp; taps</a><a href="#cocktails">Cocktails</a></nav>

<section class="sec dark pg1" id="dimsum"><div class="in">
<img src="logo/A-lockup-reversed.svg" alt="Cabin East · Wok Steam Draught" style="display:block;margin:-24px auto 22px;width:min(420px,80%);border-radius:14px">
{sh("Dim Sum","Hand-folded · 4 to a basket · steamed to order")}
<div class="grid" style="margin-top:20px">{dim}</div>
{sh("Bao","Soft pillowy buns · 2 to a plate",sub=True)}
<div class="grid" style="margin-top:18px">{bao}</div>
<div class="band"><strong>Steamer for two · 799</strong><span>2 baskets of dim sum and a plate of bao, our pick of the day. Best with a Comrade Crisp: 179 at happy hour.</span></div>
</div></section>

<section class="sec cream" id="wok"><div class="in">
{sh("From the Wok","High flame · double-fried · extra chilli","Indo-Chinese cabin classics and Korean bar food. On most dishes you pick your protein.")}
{hero}
<div class="grid">{wok}</div>
{wokmore}
</div></section>

<section class="sec dark" id="mains"><div class="in">
{sh("Mains","Thai · Burmese · street-style","One big bowl. Add jasmine rice, 120, to any curry.")}
<div class="grid">{mains}</div>
{mainsmore}
<div class="band"><span><strong>Cabin feast for four</strong><br>4 soups, Cabin Fever chicken, Salt &amp; Pepa chonak, mixed Noodle Around, Green With Envy with rice, darsaan. About 12% under ordering separately.</span><span class="big">2,299</span></div>
<div class="band" style="margin-top:16px"><span><strong>Bowl Game · lunch, 12 to 4</strong><br>Any noodles or fried rice + Cabin Fever chicken 440, or paneer 380, or a green curry with rice 360.</span></div>
</div></section>

<section class="sec cream" id="sweet"><div class="in">
{sh("Something Sweet","End on a high")}
<div class="grid" style="margin-top:18px">{sweet}</div>
{sh("On Tap","Brewed up the coast",sub=True)}
<div class="band" style="margin:16px 0 0"><strong>Happy hour 12 to 6</strong><span>330 ml taps 179 · Kings 330 ml 99 · Crystal Clear dumplings 179 · Cabin Fever chicken 249</span></div>
<div class="grid" style="margin-top:20px">{taps}</div>
{tapmore}
</div></section>

<section class="sec wine" id="cocktails"><div class="in">
{sh("Cocktails","Feni · kokum · soju · lemongrass")}
<div class="grid" style="margin-top:18px">{cock}</div>
{cockmore}
{sh("Zero Proof","Pressed and brewed in house",sub=True)}
<div class="grid" style="margin-top:18px">{zero}</div>
{sh("Whisky &amp; Vodka","30 / 60 ml",sub=True)}
{spirits}
<p class="foot">Prices in rupees, taxes extra. <i class="m v"></i>veg <i class="m n"></i>non-veg. Tell us about allergies: shellfish, pork, peanuts, gluten, egg, soy, sesame. Alcohol is served only to guests aged 21 and over. Please drink responsibly. Photos show the style of each dish.</p>
</div></section>
</body></html>'''
# Self-contained output: embed images, fonts and logo so the file works wherever it is opened or sent.
import base64,re
def b64(p,mime): return f'data:{mime};base64,'+base64.b64encode(open(p,'rb').read()).decode()
html=re.sub(r'src="(img/[^"]+\.jpg)"',lambda m:'src="'+b64(m.group(1),'image/jpeg')+'"',html)
html=re.sub(r'src="(logo/[^"]+\.svg)"',lambda m:'src="'+b64(m.group(1),'image/svg+xml')+'"',html)
html=re.sub(r'url\((fonts/[^)]+\.ttf)\)',lambda m:'url('+b64(m.group(1),'font/ttf')+')',html)
open('index.html','w').write(html)
