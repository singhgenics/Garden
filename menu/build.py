# Builds the photo menu (index.html): the screen menu and, through its print rules, the two-sheet A3 menu (picture-menu.pdf).
# 8 photos, every other dish a text line. Rules and reasoning: MENU-ENGINEERING.md and expert-notes-menu-engineering.md.
# Prices from the live menu data (no currency symbols on purpose). Allergen lines are read from ingredient lists: the chef must confirm them.
# After a change: python3 build.py, then export the PDF:
#   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf=picture-menu.pdf file://$PWD/index.html
# and check each print sheet still fits (food and drinks must each be one A3 page).
import re,base64
CSS=r'''
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
figcaption{padding:12px 2px 0}
h3{margin:0;font:600 23px/1.15 Plex,sans-serif;letter-spacing:-.005em}
.p{display:none}
.cream .p{color:var(--burg)}
figcaption p{margin:3px 0 0;font-size:15px;opacity:.82}
.s3 h3,.s4 h3{font-size:20px}.s3 figcaption p,.s4 figcaption p{font-size:14px}
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
.hero .vars{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}.hero .vars span{border:1px solid #c49a3c99;border-radius:99px;padding:7px 14px;font-size:16px}.hero .vars b{font:600 17px PlexMono,monospace;color:var(--brass);margin-left:6px}
.pair{background:#0003;border-left:3px solid var(--brass);padding:9px 12px;font-size:14.5px}.pair b{color:var(--brass)}
.band{border:2px solid var(--brass);border-radius:16px;padding:18px 24px;margin-top:30px;display:flex;flex-wrap:wrap;gap:6px 26px;justify-content:space-between;align-items:center}
.band strong{font:26px Alfa,Georgia,serif;color:var(--brass);font-weight:400}.cream .band{border-color:var(--burg)}.cream .band strong{color:var(--burg)}
.band span{font-size:16px;max-width:56ch}
.band .big{font:46px/1 PlexMono,monospace;color:var(--brass);font-weight:600}.band.top{margin:0 0 22px}
.more{margin-top:26px;display:grid;column-gap:44px}.c2{grid-template-columns:1fr 1fr}
.more .ln{padding:8px 0;font-size:16px;line-height:1.35}.more .ln.wide{grid-column:1/-1}
.more b{font-weight:600}.more em{display:none}.more .ln span{display:block;font-size:14px;opacity:.78}
.c1{grid-template-columns:1fr}
.foot{margin-top:40px;font-size:13.5px;opacity:.75;border-top:1px solid #c49a3c66;padding-top:14px}
@media screen and (max-width:820px){.s3{grid-column:span 6}.s4,.s5,.s6,.s7{grid-column:span 12}.hero{grid-template-columns:1fr}.hero .ph{min-height:0;aspect-ratio:4/3}.c2{grid-template-columns:1fr}.s7 .ph,.s5 .ph{aspect-ratio:4/3}}
@media screen and (max-width:560px){.s3{grid-column:span 12}.s3 .ph{aspect-ratio:4/3}.in{padding:0 16px}.band .big{font-size:36px}}
'''
EXTRA='''
html{scroll-padding-top:76px}
nav{align-items:center;justify-content:flex-start}nav>:first-child{margin-left:auto}nav>:last-child{margin-right:auto}
.flt{flex:none;display:flex;border:1px solid #f2e8d255;border-radius:99px;overflow:hidden;margin-right:6px}
.flt button{font:12px PlexMono,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--cream);background:none;border:0;padding:8px 12px;cursor:pointer}
.flt button[aria-pressed=true]{background:var(--brass);color:var(--ink)}
.meta{margin-top:5px;font-size:12.5px;opacity:.8;display:flex;flex-wrap:wrap;gap:2px 10px;align-items:center}.heat{color:var(--brass);font-size:18px;line-height:1;letter-spacing:1px}.cream .heat{color:var(--burg)}
.hero .meta{margin:0 0 12px;font-size:13px}
.more .ln .meta{margin-top:2px}
.dessertbtn{display:block;width:100%;margin-top:44px;padding:16px 20px;border:2px solid var(--burg);border-radius:14px;background:none;color:var(--burg);font:700 17px Plex,sans-serif;cursor:pointer;text-align:left}
.dessertbtn small{display:block;font:500 13px Plex,sans-serif;opacity:.8}
.hide{display:none!important}
.hh s{opacity:.65}
@media screen{.after.collapsed{display:none}.grid.filtered{display:flex;flex-wrap:wrap}.grid.filtered .card{flex:1 1 250px}.grid.filtered .ph{aspect-ratio:16/10}}
@media print{.flt,.dessertbtn{display:none}.after.collapsed{display:block}}
'''
JS='''
(()=>{const f=[...document.querySelectorAll('.flt button')];
 const set=m=>{f.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m)));
  document.querySelectorAll('.grid').forEach(g=>g.classList.toggle('filtered',m!=='all'));
  document.querySelectorAll('[data-v]').forEach(e=>{const v=e.dataset.v;e.classList.toggle('hide',(m==='veg'&&v==='nv')||(m==='nv'&&v==='v'))});};
 const fill=()=>document.querySelectorAll('.more.c2').forEach(m=>{const v=[...m.children].filter(c=>!c.classList.contains('hide'));v.forEach(c=>c.classList.remove('wide'));if(v.length%2)v[v.length-1].classList.add('wide')});
 f.forEach(b=>b.addEventListener('click',()=>{set(b.dataset.m);fill()}));fill();
 const d=document.getElementById('dessertbtn'),a=document.getElementById('after');
 if(d)d.addEventListener('click',()=>{const c=a.classList.toggle('collapsed');d.setAttribute('aria-expanded',String(!c));d.firstChild.textContent=c?'Dessert and coffee ▾':'Dessert and coffee ▴'});
 if(location.hash==='#after'&&a){a.classList.remove('collapsed')}
})();
'''
MK={'v':'<i class="m v" title="Veg"></i>','nv':'<i class="m n" title="Non-veg"></i>','vn':'<i class="m v" title="Veg"></i><i class="m n" title="Non-veg"></i>','':''}
# veg / non-veg marker for every food line (FSSAI) and the filter; drinks have none and always show
VEG={'Crystal Clear':'v','Fire Starters':'nv','Siu Mai Goodness':'nv','Prawn to Be Wild':'nv','Seoul Mate':'v','Fever Pitch':'nv','Bao Down':'nv',
 'Cabin Fever':'vn','Honey Trap':'vn','Fry Hard':'v','Wonton More':'vn','Salt & Pepa':'vn','K-Pop Wings':'nv',
 'Smash Hit':'v','Hot & Bothered':'vn','Wonton Kenobi':'nv','Coconut Cuddle':'vn','Slap Happy':'v',
 'Noodle Around':'vn','Rice Rice Baby':'vn','Man, Churian!':'vn','Green With Envy':'vn','Holy Basil, Batman!':'nv','Suey Generis':'vn','Plain Jane':'v',
 'Honey, I Shrunk the Noodles':'v','Sticky Situation':'v','Scoop There It Is':'v'}
# Allergens read from each dish's ingredient list in the menu data. THE CHEF MUST CONFIRM THESE AGAINST THE RECIPES before it goes live.
AL={'Crystal Clear':'soy, wheat','Fire Starters':'wheat, sesame','Siu Mai Goodness':'pork, wheat','Prawn to Be Wild':'shellfish, wheat, soy','Seoul Mate':'milk, soy, sesame, wheat',
 'Fever Pitch':'egg, soy, wheat','Bao Down':'pork, peanuts, soy, sesame, wheat','Cabin Fever':'egg, soy (pork option: pork)','Honey Trap':'egg, sesame','Fry Hard':'milk, egg, soy',
 'Wonton More':'wheat, sesame, soy','Salt & Pepa':'egg, wheat, mustard (chonak: fish; prawns: shellfish)','K-Pop Wings':'soy, wheat','Smash Hit':'sesame','Hot & Bothered':'soy, egg',
 'Wonton Kenobi':'wheat, egg','Slap Happy':'peanuts','Noodle Around':'wheat, soy (mixed: egg, shellfish)','Rice Rice Baby':'soy (chicken and mixed: egg)','Man, Churian!':'soy, wheat',
 'Green With Envy':'(prawn option: shellfish)','Holy Basil, Batman!':'egg, soy','Suey Generis':'egg, wheat','Honey, I Shrunk the Noodles':'milk, wheat, sesame','Sticky Situation':'milk, sesame',
 'Scoop There It Is':'milk, peanuts, sesame','Comrade Crisp':'gluten','Gose Bumps':'gluten','Kings':'gluten','Budweiser':'gluten','Guest Tap':'gluten','Tasting Paddle':'gluten',
 'Somaek':'gluten','Soju Yakult':'milk','Irish Coffee':'milk','Kimchi Mary':'ask us (kimchi brine)'}
HEAT={'Cabin Fever':2,'Honey Trap':1,'Salt & Pepa':1,'Wonton More':1,'Fire Starters':2,'Siu Mai Goodness':1,'Seoul Mate':1,'Fever Pitch':2,'K-Pop Wings':1,'Fry Hard':1,'Slap Happy':2,'Smash Hit':1,
 'Hot & Bothered':2,'Coconut Cuddle':1,'Noodle Around':1,'Holy Basil, Batman!':2,'Green With Envy':2,'Suey Generis':1,'Man, Churian!':1}
def meta(name):
    h=HEAT.get(name,0); a=AL.get(name,'')
    if not h and not a: return ''
    heat=f'<span class="heat" title="Spice {h} of 3">{"•"*h}</span>' if h else ''
    al=f'<span class="al">Contains: {a}</span>' if a else ''
    return f'<div class="meta">{heat}{al}</div>'
def dv(name): return f' data-v="{VEG[name]}"' if name in VEG else ''


def card(img,name,sub,price,tag='',ar='3/2',span=6):
    t=f'<b class="tag">{tag}</b>' if tag else ''
    return (f'<figure class="card s{span}"{dv(name)}><div class="ph" style="--ar:{ar}"><img src="img/{img}.jpg" alt="{name}">{t}</div>'
            f'<figcaption><h3>{MK[VEG.get(name,"")]}{name}</h3><p>{sub} {price}</p>{meta(name)}</figcaption></figure>')
def rows(items,cols=2):
    return f'<div class="more c{cols}">'+''.join(f'<div class="ln"{dv(n)}><b>{MK[VEG.get(n,"")]}{n}</b><span>{d} {p}</span>{meta(n)}</div>' for n,d,p in items)+'</div>'
def sh(title,small,lede='',sub=False):
    l=f'<p class="lede">{lede}</p>' if lede else ''
    return f'<div class="sh{" sub" if sub else ""}"><h2>{title}</h2><small>{small}</small></div>{l}'

# ---- food face ----
dim_ph=card('crystal','Crystal Clear','Water chestnut, carrot and edamame folded by hand into a glass-clear wheat-starch skin, steamed to order.','220','','7/5',7)+\
       card('siumai','Siu Mai Goodness','Open-topped siu mai of smoky Goan chouriço and chicken, steamed and finished with housemade chilli oil.','300','Signature','1/1',5)
dim_tx=rows([('Fire Starters','Housemade chicken wontons poached silky, then drowned in our own chilli oil, black vinegar and sesame.','280'),
 ('Prawn to Be Wild','Plump pink prawn, garlic chives and bamboo shoot in a pleated wheat-starch skin, with chilli-soy.','340')])
bao_ph=card('baodown','Bao Down','Pork belly slow-braised three hours in soy and star anise, seared to order with hoisin and peanut crumb.','320','Signature','3/2',12)
bao_tx=rows([('Seoul Mate','Paneer seared hard and glazed sticky-spicy with gochujang, tucked into a soft bun with cucumber and sesame.','260'),
 ('Fever Pitch','Our crisp Cabin Fever chicken with pickled onion and chilli mayo, piled into a soft steamed bun.','280')])
hero=f'''<figure class="hero" data-v="vn"><div class="ph"><img src="img/cabinfever.jpg" alt="Cabin Fever"><b class="tag burg">Bestseller</b></div>
<figcaption><small>Our wok classic</small><h3><i class="m v"></i><i class="m n"></i>Cabin Fever</h3>
<p>Double-fried, then tossed on full flame so the green chilli sauce catches and smokes.</p>
<div class="vars"><span>Paneer <b>280</b></span><span>Chicken <b>320</b></span><span>Pork belly <b>360</b></span></div>
{meta('Cabin Fever')}<div class="pair">Pair it with a pint of <b>Gose Bumps</b> · 260</div></figcaption></figure>'''
wok_tx=rows([('Honey Trap','Twice-fried potato fingers or chicken strips, tossed in a sticky honey-chilli glaze with sesame. Potato 220 · chicken 320',''),
 ('Fry Hard','Crisp fries loaded with housemade kimchi and melted cheese, finished under the torch with gochujang mayo.','240'),
 ('Wonton More','Hand-folded wontons fried golden to order, served hot with a sticky sweet chilli dip. Veg 240 · chicken 260',''),
 ('Salt & Pepa','Fried crisp in a thin batter, tossed with crushed pepper, fried garlic and green chilli, with kasundi mayo. Mushroom 260 · chonak 420 · prawns 460',''),
 ('K-Pop Wings','Six wings in a potato-starch crust, fried twice for a glass-crisp shell, brushed with soy-garlic or gochujang.','380')],1)
soups=rows([('Smash Hit','Cucumber smashed to order so it soaks up black vinegar, garlic and housemade chilli oil, finished with sesame.','160'),
 ('Hot & Bothered','Mushroom, bamboo shoot, tofu and silky egg ribbons in a peppery broth finished sharp with black vinegar. Veg 180 · chicken 210',''),
 ('Wonton Kenobi','Our chicken wontons poached and floated in a clear ginger-chicken broth with bok choy and white pepper.','220'),
 ('Coconut Cuddle','Thai coconut broth with galangal, lemongrass and lime leaf, sour and soothing, with mushroom and chilli. Veg 220 · chicken 250',''),
 ('Slap Happy','Green papaya, long beans and peanuts pounded to order in the mortar: sour, sweet, hot and crunchy.','240')],1)
mains_ph=card('noodlearound','Noodle Around','Thin noodles tossed dry on a high flame, street style, with cabbage, carrot and chilli vinegar. Veg 240 · chicken 280 · mixed 340','',"Chef’s pick",'3/2',12)
mains_tx=rows([('Rice Rice Baby','Day-old rice fried hot with real wok smoke and burnt garlic, every grain separate. Veg 240 · chicken 280 · mixed 320',''),
 ('Man, Churian!','Crisp-fried veg dumplings or chicken simmered briefly in a dark ginger-garlic-soy Manchurian gravy. Veg 260 · chicken 300',''),
 ('Green With Envy','Thai green curry from paste pounded in house, simmered gently in coconut milk with aubergine and basil. Veg 300 · chicken 340 · prawn 440',''),
 ('Holy Basil, Batman!','Minced chicken with holy basil from our courtyard, bird’s-eye chilli and a runny fried egg over rice.','320'),
 ('Suey Generis','A Burmese coconut-curry noodle bowl, built your way with crispy noodles, fried onion, lime and chilli. Veg 320 · chicken 360',''),
 ('Plain Jane','Steamed jasmine rice, fragrant and plain, for the curries.','120')],1)

# ---- drinks face ----
taps_ph=card('gose','Gose Bumps','Susegado kokum gose, tart, salty and pink, soured with kokum from our own coast. Try this first. Pint 260 · 500 ml 350','','Konkan touch','3/2',12)
taps_tx=rows([('Comrade Crisp','People’s Lager, a crisp rice lager from a small farm-to-barrel brewery in Sangolda: the beach beer. Pint 220 · 500 ml 300',''),
 ('Kings','The coast’s own cult pilsner, crisp and a little malty, served ice-cold. 330 ml 120 · 650 ml 180',''),
 ('Budweiser','The easy American classic: light, clean and gently sweet, poured ice-cold. 330 ml 180 · 650 ml 260',''),
 ('Guest Tap','A new keg from up the coast every couple of weeks: ask what is pouring. Pint 260 · 500 ml 360',''),
 ('Tasting Paddle','Three 150 ml pours of every tap on a wooden paddle, the best way to meet the taps. Pitcher of Comrade Crisp 850','320')],1)
cock_ph=card('kokumsour','Kokum Feni Sour','Cashew feni from Goa shaken hard with kokum, lime and aquafaba for a silky pink foam, served up.','420','Konkan touch','3/2',12)
cock_tx=rows([('Somaek','A shot of soju dropped into a cold lager, the loud and cheerful Seoul pub classic.','360'),
 ('Coconut Feni Highball','Coconut feni and housemade lemongrass syrup built over ice and topped with soda: our long, easy drink.','380'),
 ('Sichuan G&T','Gin and tonic built tall with grapefruit, finished with Sichuan pepper for a gentle, tingling hum.','420'),
 ('Soju Yakult','Soju, Yakult and fresh lime shaken over ice: sweet, tangy and dangerously easy, a Seoul bar classic.','420'),
 ('Kimchi Mary','Vodka, tomato and housemade kimchi brine rolled between tins to keep it smooth, with a gochugaru rim.','420'),
 ('Lychee & Lemongrass Martini','Vodka, lychee, lemongrass and lime, shaken hard, double-strained and crowned with a whole lychee.','440'),
 ('Tamarind Chilli Margarita','Agave spirit, tamarind and lime shaken and served on the rocks with a chilli-salt rim.','460')],1)
zero=rows([('Fresh Lime Soda','Limes pressed to order with soda, sweet or salted: the cabin-table standard.','120'),
 ('Kokum Soda','Kokum and black salt over soda, the coast’s salty-sour pink summer cooler.','140'),
 ('Lemongrass-Ginger Iced Tea','Black tea brewed in house with lemongrass and ginger, then chilled and served over ice.','160'),
 ('Tonic or Ginger Ale','Indian tonic or ginger ale, over ice.','120'),('Soft Drinks','Coke, Diet Coke, Thums Up or Sprite, chilled.','80'),('Water','Still 1 L 60 · sparkling 330 ml 120','')],1)
spirits=rows([('Dewar’s White Label','Our highball whisky: honeyed and soft, served tall over ice with soda and a lemon twist.','200 / 380'),
 ('House Infused Vodkas','Lemongrass-ginger or chilli-garlic, infused in house and served ice-cold as a shot, or with tonic.','240 / 440'),
 ('Jameson','Irish whiskey, smooth with vanilla and toasted wood: neat, with ginger ale, or in our Irish coffee.','280 / 520'),
 ('Paul John Brilliance','Indian single malt distilled in Cuncolim, South Goa: honey, vanilla and toffee, neat or on one large cube.','320 / 600'),
 ('Glenlivet 12','Speyside single malt, the easy first malt: pineapple, pear and vanilla, neat or on a rock.','420 / 800'),
 ('Suntory Toki Highball','Japanese blended whisky with green apple and white pepper, built tall with ice, soda and a lemon twist.','420'),
 ('Talisker 10','Isle of Skye single malt for peat lovers: sea salt, black pepper and bonfire smoke, neat.','520 / 1,000')],1)

# ---- dessert face ----
sweet_ph=card('darsaan','Honey, I Shrunk the Noodles','Flat noodles fried crisp, tossed in hot honey and sesame, with a scoop of vanilla ice cream.','220','Our dessert','3/2',12)
sweet_tx=rows([('Sticky Situation','Steamed sticky rice soaked in warm salted coconut cream and palm jaggery, poured over ice cream.','220'),
 ('Scoop There It Is','Two scoops of vanilla, tender coconut or kokum, with warm palm jaggery syrup, sesame-peanut crunch or chocolate.','150'),
 ('Brewed Coffee','Single-estate Indian arabica, filter-brewed in small batches through the day, black or with hot milk. Black 120 · with milk 140',''),
 ('Irish Coffee','Brewed coffee, Jameson, brown sugar and lightly whipped cold cream: our one hot cocktail, sweet and spiked.','360')],1)

PRINT='''
.s12{grid-column:span 12}
.more .ln .meta span{display:inline;font-size:inherit;opacity:inherit}.more .ln .meta{display:block}
.mast{display:none}
@page{size:A3;margin:0}
@media print{
 body{width:1123px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 nav,.flt,.dessertbtn{display:none}
 .face{width:1123px;height:1587px;overflow:hidden;break-after:page;padding:34px 44px 24px;background:var(--paper);color:var(--ink);position:relative}
 .face:last-child{break-after:auto}
 .mast{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid var(--ink);padding-bottom:10px;margin-bottom:16px}
 .mast img{height:62px;border-radius:10px}.mast .t{font:12px PlexMono,monospace;letter-spacing:.2em;text-transform:uppercase;text-align:right;color:var(--burg)}.mast .t b{display:block;font:30px Alfa,serif;letter-spacing:.02em;color:var(--ink);font-weight:400;margin-bottom:4px}
 .cols{columns:3;column-gap:32px;column-fill:balance}.face.food .cols{zoom:1.04}
 .face.drinks .cols{columns:3;column-gap:32px;column-fill:balance;zoom:1.1}.face.drinks .card .ph{aspect-ratio:16/10!important}
 .sec,.dark,.cream,.wine{padding:0!important;margin:0 0 12px;background:none!important;color:var(--ink)!important;break-inside:auto;height:auto!important;overflow:visible!important}
 .in{max-width:none;padding:0}
 .dark .sh small,.wine .sh small{color:var(--burg)}.dark .sh,.wine .sh{border-color:var(--burg)}
 .dark .band,.wine .band{border-color:var(--burg)}.dark .band strong,.wine .band strong,.dark .band .big,.wine .band .big{color:var(--burg)}
 .dark .heat,.wine .heat{color:var(--burg)}.biglogo{display:none}
 .sh h2{font-size:24px}.sh{padding-bottom:6px;margin-bottom:6px}.sh small{font-size:10px;letter-spacing:.08em}.sh.sub{margin-top:14px}.lede{font-size:13px;margin-bottom:8px}
 .grid{display:block;margin:8px 0 2px}.card{margin:0 0 8px;break-inside:avoid}.card .ph{aspect-ratio:2/1!important}.ph{aspect-ratio:16/9!important}
 .hero{display:block;margin:12px 0 14px;break-inside:avoid}.hero .ph{min-height:0;aspect-ratio:2/1}.hero figcaption{padding:12px 14px}.hero h3{font-size:26px}.hero p{font-size:13px;margin-bottom:8px}.hero .vars{margin-bottom:8px}.pair{font-size:12.5px;padding:6px 10px}
 h3{font-size:16px}figcaption p{font-size:13px}.meta{font-size:10.5px;margin-top:2px}.heat{font-size:15px}
 .more{display:block;margin-top:6px}.more .ln{padding:2px 0;font-size:14px;line-height:1.28;break-inside:avoid}.more .ln span{font-size:13px;opacity:.9}
 .band{margin:8px 0;padding:8px 12px;break-inside:avoid;border-width:1.5px}.band strong{font-size:17px}.band span{font-size:12.5px}.band .big{font-size:24px}
 .vars span{padding:5px 11px;font-size:14px}
 .sh{display:block;break-inside:avoid;break-after:avoid}.sh h2,.sh small{display:inline-block;vertical-align:baseline}.sh small{margin-left:10px}.lede{break-after:avoid}.biglogo{display:none!important}.card h3{font-size:16px!important}.meta{display:block}.more .ln .meta span,.meta span{display:inline;font-size:inherit;opacity:inherit}.heat{margin-right:8px}.hero .meta{font-size:11.5px}
 .after.collapsed{display:block}
 .foot{position:absolute;left:44px;right:44px;bottom:22px;margin:0;font-size:11px;padding-top:7px;color:#5b4d40;border-top:1px solid var(--brass)}
}
'''
def mast(t): return f'<div class="mast"><img src="logo/A-lockup-reversed.svg" alt="Cabin East"><div class="t"><b>{t}</b>Wok | Steam | Draught</div></div>'
body=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cabin East · Picture menu</title><style>{CSS}{EXTRA}{PRINT}</style></head><body>
<nav><div class="flt" role="group" aria-label="Show"><button data-m="all" aria-pressed="true">All</button><button data-m="veg" aria-pressed="false">Veg</button><button data-m="nv" aria-pressed="false">Non-veg</button></div><a href="#dimsum">Dim sum &amp; bao</a><a href="#wok">Wok</a><a href="#mains">Mains</a><a href="#taps">Taps</a><a href="#cocktails">Cocktails</a><a href="#dessert">Dessert</a></nav>

<div class="face food">{mast('Food')}<div class="cols">
<section class="sec dark pg1" id="dimsum"><div class="in">
<img src="logo/A-lockup-reversed.svg" alt="Cabin East · Wok Steam Draught" class="biglogo" style="display:block;margin:-24px auto 22px;width:min(420px,80%);border-radius:14px">
{sh("Dim Sum &amp; Bao","Hand-folded · dim sum 4 to a basket · bao 2 to a plate")}
<div class="band top" style="margin-top:20px"><strong>Steamer for two · 799</strong><span>2 baskets of dim sum and a plate of bao, our pick of the day. Best with a Comrade Crisp.</span></div>
<div class="grid" style="margin-top:0">{dim_ph}</div>
{dim_tx}
<div class="grid" style="margin-top:22px">{bao_ph}</div>
{bao_tx}
</div></section>
<section class="sec cream" id="wok"><div class="in">
{sh("From the Wok","High flame · double-fried · extra chilli","Indo-Chinese cabin classics and Korean bar food. On most dishes you pick your protein.")}
{hero}
{wok_tx}
{sh("Soups &amp; Salads","Light, sharp, cold",sub=True)}
{soups}
</div></section>
<section class="sec dark" id="mains"><div class="in">
{sh("Mains","Thai · Burmese · street-style","One big bowl. Add steamed jasmine rice, Plain Jane, 120, to any curry.")}
<div class="band top" style="margin-top:22px"><span><strong>Cabin feast for four</strong><br>4 soups, Cabin Fever chicken, Salt &amp; Pepa chonak, mixed Noodle Around, Green With Envy with rice, darsaan. About 12% under ordering separately.</span><span class="big">2,299</span></div>
<div class="grid" style="margin-top:0">{mains_ph}</div>
{mains_tx}
<div class="band" style="margin-top:16px"><span><strong>Bowl Game · lunch, 12 to 4</strong><br>Any noodles or fried rice + Cabin Fever chicken 440, or paneer 380, or a green curry with rice 360.</span></div>
</div></section>
</div></div>

<div class="face drinks">{mast('Drinks')}<div class="cols">
<section class="sec cream" id="taps"><div class="in">
{sh("On Tap &amp; Bottle","Brewed up the coast")}
<div class="band" style="margin:16px 0 0"><strong>Happy hour 12 to 6</strong><span class="hh">330 ml taps 179 <s>pint 220</s> · Kings 330 ml 99 <s>120</s></span></div>
<div class="grid" style="margin-top:20px">{taps_ph}</div>
{taps_tx}
</div></section>
<section class="sec wine" id="cocktails"><div class="in">
{sh("Cocktails","Feni · kokum · soju · lemongrass")}
<div class="grid" style="margin-top:18px">{cock_ph}</div>
{cock_tx}
</div></section>
<section class="sec wine" id="spirits"><div class="in">
{sh("Zero Proof","Pressed and brewed in house")}
{zero}
{sh("Whisky &amp; Vodka","30 / 60 ml",sub=True)}
<div class="band top" style="margin-top:18px"><strong>Single malt flight · 650</strong><span>Paul John, Glenlivet 12 and Talisker 10, 20 ml each, on a board with tasting notes and chilli peanuts.</span></div>
{spirits}
</div></section>
<section class="sec cream" id="dessert"><div class="in">
<button class="dessertbtn" id="dessertbtn" aria-expanded="false" aria-controls="after">Dessert and coffee ▾<small>Ready when you are: ask us, or tap here</small></button>
<div class="after collapsed" id="after">
{sh("Something Sweet","End on a high")}
<div class="grid" style="margin-top:18px">{sweet_ph}</div>
{sweet_tx}
</div>
</div></section>
</div><p class="foot">Prices in rupees, taxes extra. <i class="m v"></i>veg <i class="m n"></i>non-veg · <span class="heat">•</span> to <span class="heat">•••</span> spice, one to three. Allergens are listed from our recipes; our kitchen also handles shellfish, pork, peanuts, gluten, egg, soy, sesame and milk, so please tell us about any allergy. Alcohol is served only to guests aged 21 and over. Please drink responsibly. Photos show the style of each dish.</p>
</div>

<script>{JS}</script>
</body></html>'''
def b64(p,mime): return f'data:{mime};base64,'+base64.b64encode(open(p,'rb').read()).decode()
body=re.sub(r'src="(img/[^"]+\.jpg)"',lambda m:'src="'+b64(m.group(1),'image/jpeg')+'"',body)
body=re.sub(r'src="(logo/[^"]+\.svg)"',lambda m:'src="'+b64(m.group(1),'image/svg+xml')+'"',body)
body=re.sub(r'url\((fonts/[^)]+\.ttf)\)',lambda m:'url('+b64(m.group(1),'font/ttf')+')',body)
open('index.html','w',encoding='utf-8').write(body)
print('wrote index.html',len(body)//1024,'KB')
