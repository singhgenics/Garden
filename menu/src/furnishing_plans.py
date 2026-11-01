#!/usr/bin/env python3
"""Draws two plans for the Furnishings section from the same coordinates as the Simplex 3D model / plan:
   img/furnishings/furniture-plan.svg   furniture + finishes, every piece coded
   img/furnishings/ceiling-plan.svg     reflected ceiling: lights, fans, ACs, speakers, signs
x runs from the right wall (-2.45) to the left wall (+2.45) as you walk in; z from the shopfront (0) to the back wall (8.8); the plan is drawn
road at the bottom, like the Simplex plan. Also prints the fan clearance checks."""
import math, os
X0,X1,D,T,KZ=-2.45,2.45,8.8,0.2,6.3
GW=X1+T
S=150
Z0,Z1=-2.9,D+0.6                    # drawn z range (garden to just behind the back wall)
LEFT=60; TOP=90
W_PLAN=int((X1-X0+0.9)*S)
def P(x,z): return (LEFT+(X1+0.45-x)*S, TOP+(Z1-z)*S)
def build(title, subtitle, body, legend_w, legend):
    h=int((Z1-Z0)*S)+TOP+80
    w=W_PLAN+LEFT+legend_w+30
    o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif">',
       f'<rect width="{w}" height="{h}" fill="#FBF7EF"/>',
       f'<text x="{LEFT}" y="38" font-size="26" font-weight="700" fill="#1B1714">{title}</text>',
       f'<text x="{LEFT}" y="62" font-size="13" fill="#6a5d4e">{subtitle}</text>']
    o+=body
    lx=LEFT+W_PLAN+20
    o.append(f'<g transform="translate({lx},{TOP})">'+legend+'</g>')
    o.append(f'<text x="{LEFT}" y="{h-26}" font-size="12" fill="#6a5d4e">Metres. Left and right as you walk in from the road (road at the bottom). Concept drawing for the fit-out brief, not for construction. Positions follow the Simplex 3D model.</text>')
    o.append('</svg>'); return '\n'.join(o)

class Pen:
    def __init__(s): s.o=[]
    def rect(s,xa,xb,za,zb,fill='none',stroke='#3a3128',sw=1.2,dash=None,op=1,r=0):
        a,b=P(max(xa,xb),max(za,zb)); c,d=P(min(xa,xb),min(za,zb))
        s.o.append(f'<rect x="{a:.1f}" y="{b:.1f}" width="{c-a:.1f}" height="{d-b:.1f}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
    def circ(s,x,z,r,fill='none',stroke='#3a3128',sw=1.2,dash=None,op=1):
        a,b=P(x,z); s.o.append(f'<circle cx="{a:.1f}" cy="{b:.1f}" r="{r*S:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
    def line(s,xa,za,xb,zb,stroke='#3a3128',sw=1.2,dash=None,op=1):
        a,b=P(xa,za); c,d=P(xb,zb); s.o.append(f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{d:.1f}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
    def text(s,x,z,t,size=11,fill='#2a2420',anchor='middle',weight=500,rot=0):
        a,b=P(x,z); tr=f' transform="rotate({rot} {a:.1f} {b:.1f})"' if rot else ''
        s.o.append(f'<text x="{a:.1f}" y="{b+size*0.35:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}"{tr}>{t}</text>')
    def tag(s,x,z,code,fill='#B5321C',tc='#fff'):
        a,b=P(x,z); w=7.2*len(code)+10
        s.o.append(f'<rect x="{a-w/2:.1f}" y="{b-9:.1f}" width="{w:.1f}" height="18" rx="9" fill="{fill}"/><text x="{a:.1f}" y="{b+4:.1f}" font-size="11" fill="{tc}" text-anchor="middle" font-weight="700">{code}</text>')
    def raw(s,t): s.o.append(t)

def base(p, faint=False):
    op=0.55 if faint else 1
    # garden, shell, washroom block, kitchen outline, bar
    p.rect(-GW,GW,-2.0,-0.06,'#efe6d2','#b9a989',1)
    p.rect(-GW,-0.6,-2.2,-2.02,'#c97a5a','#8f4a32',1); p.rect(0.6,GW,-2.2,-2.02,'#c97a5a','#8f4a32',1)
    for x in (-(GW-0.1),GW-0.1): p.rect(x-0.08,x+0.08,-2.0,-1.84,'#8f5634','#8f5634',1)
    p.rect(X0-T,X0,0,D+T,'#4a4038','#4a4038',1); p.rect(X1,X1+T,0,D+T,'#4a4038','#4a4038',1)
    p.rect(X0,0.95,D,D+T,'#4a4038','#4a4038',1); p.rect(1.75,X1,D,D+T,'#4a4038','#4a4038',1)
    p.rect(X0,X1,-0.06,0,'#9fb4c2','#4a6070',1)
    p.rect(X0,X1,KZ,KZ+0.1,'#d8c6ac','#d8c6ac',1)
    p.rect(X0,X1,KZ+0.1,D,'#f1ece3','#c9bfae',1,'5 4',op)
    p.text(0.0,7.55,'KITCHEN · see the kitchen sheets',10,'#9a8d7a',weight=600)
    # washroom block
    p.rect(X0,-1.45,3.6,3.7,'#d8c6ac','#d8c6ac',1); p.rect(X0,-1.45,3.7,4.7,'#e9efe4','#8a9a7a',1)
    p.rect(X0,-1.3,4.8,KZ,'#e9efe4','#8a9a7a',1); p.rect(-1.3,-1.2,4.7,KZ,'#d8c6ac','#d8c6ac',1)
    p.text(-1.95,5.45,'WC',9,'#6a5d4e',weight=700); p.text(-1.95,4.2,'HAND-WASH',8,'#6a5d4e',weight=700)
    # pillars
    for z in (4.8,6.8): p.rect(X0,X0+0.23,z-0.15,z+0.15,'#4a4038','#4a4038',1)
    # beams (dashed)
    for xa,xb,za,zb in ((1.335,1.565,0,D),(X0,X1,4.675,4.925),(X0,1.335,6.675,6.925),(0.325,0.475,4.925,6.675)): p.rect(xa,xb,za,zb,'none','#8a7a62',1,'6 4')

# =============================================================== FURNITURE PLAN
def furniture():
    p=Pen(); base(p)
    # right wall: two tables for 4 (T1) end-on to the wall, 1.0 m apart, 8 cane chairs (S1)
    for z0,z1 in ((0.65,1.30),(2.30,2.95)):
        p.rect(-2.45,-1.25,z0,z1,'#c69c6d'); p.tag(-1.85,(z0+z1)/2,'T1')
        for x in (-2.15,-1.55):
            for zc in (z0-0.22,z1+0.22): p.rect(x-0.22,x+0.22,zc-0.22,zc+0.22,'#efe2c8','#8f6a4a',1,None,1,3)
    p.tag(-1.55,1.52,'S1','#2F7A5B')
    # left wall: sofa (S5) with three square tables for 2 (T2), 0.375 m apart, one cane chair each
    p.rect(X1-0.5,X1,0.15,2.7,'#d9c3a0','#8f6a4a',1.2,None,1,4); p.tag(X1-0.25,1.425,'S5','#2F7A5B')
    for z0,z1 in ((0.15,0.75),(1.125,1.725),(2.1,2.7)):
        p.rect(1.4,2.0,z0,z1,'#c69c6d'); p.tag(1.7,(z0+z1)/2,'T2')
        p.rect(1.18-0.22,1.18+0.22,(z0+z1)/2-0.22,(z0+z1)/2+0.22,'#efe2c8','#8f6a4a',1,None,1,3)
    p.tag(1.18,1.425,'S1','#2F7A5B')
    # bar
    BBF=X1-0.4
    p.rect(BBF,X1,2.72,5.37,'#cfd7b2','#4a4038',1); p.tag(2.25,4.05,'B5')
    p.rect(0.35,1.2,2.94,5.22,'#efe7da','#4a4038',1.4); p.tag(0.78,4.1,'B1')
    p.rect(0.37,0.43,2.94,5.22,'#d6a84a','#8a6420',1)   # foot rail side marker
    p.line(0.28,3.0,0.28,5.16,'#b8862a',3); p.tag(0.12,5.55,'B4','#8a6420')
    for z in (3.27,3.87,4.47,5.07): p.circ(0.13,z,0.21,'#efe2c8','#8f6a4a',1.2)
    p.tag(0.13,3.27,'S2','#2F7A5B')
    p.rect(0.38,1.12,3.04,5.12,'none','#b8862a',1.4,'5 3'); p.tag(0.78,3.35,'B8','#8a6420')
    p.rect(X1-0.5,X1,5.45,6.25,'#cfd7b2','#4a4038',1); p.tag(2.2,5.85,'B10')
    p.rect(BBF,X1,2.78,3.26,'#e6d6bc','#8f6a4a',1); p.tag(2.25,3.02,'B11','#8a6420')
    # right-wall items: wall-arm globes, portrait, enamel signs
    for z in (0.2,1.68): p.circ(X0+0.08,z,0.05,'#fff3c8','#3a3128',1.2)
    p.rect(X0,X0+0.12,0.74,0.82,'#c9a227','#8a6420',1); p.tag(-2.8,0.78,'D4','#8f4a32'); p.tag(-2.8,1.3,'E2','#2F7A5B')
    # entry mat
    p.rect(-0.6,0.6,0.05,0.5,'#c8b890','#8a7a62',1,'4 3'); p.tag(0,0.28,'E1','#2F7A5B')
    # garden: table for 6 on two benches with backs (left half), two tables for 2 with cane chairs (right half)
    p.rect(1.5-0.38,1.5+0.38,-1.92,-0.22,'#d6b27e'); p.tag(1.5,-1.07,'T3')
    for s2 in (-1,1):
        p.rect(1.5+s2*0.62-0.18,1.5+s2*0.62+0.18,-1.92,-0.22,'#f3e8d6','#8f5634',1); p.tag(1.5+s2*0.62,-1.07,'S3','#2F7A5B')
    for za,zb in ((-1.92,-1.32),(-0.87,-0.27)):
        zc=(za+zb)/2; p.rect(-2.0,-1.3,za,zb,'#d6b27e'); p.tag(-1.65,zc,'T4')
        for x in (-2.22,-1.08): p.rect(x-0.22,x+0.22,zc-0.22,zc+0.22,'#efe2c8','#8f6a4a',1,None,1,3)
    p.rect(-0.35,0.3,-2.6,-2.45,'#222','#222',1); p.text(0,-2.52,'chalkboard',7,'#fff'); p.tag(0.0,-2.75,'D6','#8f4a32')
    p.text(0,-2.95,'BEER GARDEN · 5.3 × 2.0 m',11,'#6a5d4e')
    # washroom fittings
    p.tag(-2.05,5.7,'W4','#4a6070'); p.tag(-2.05,3.9,'W2','#4a6070')
    # labels on floor
    p.text(-0.7,1.8,'WINDOW TABLES · 4 + 4',10,'#6a5d4e',weight=700,rot=90); p.text(0.8,1.4,'SOFA · 3 + 3',10,'#6a5d4e',weight=700,rot=90)
    p.text(-0.55,4.5,'1.5 m aisle',10,'#6a5d4e',weight=600,rot=90)
    # finishes key (left-hand strip text)
    p.text(0.0,0.75,'F1 checker floor',9,'#9a8d7a')
    # dims
    return build('Furniture &amp; finishes plan', '18 covers inside + 10 in the garden · every piece has a code from the Furnishings schedule below · central aisle about 2.2 m, sofa tables 0.375 m apart', p.o, 330, legend_furn())

def legend_furn():
    rows=[('T1','Table for 4 · 1.20 × 0.65 (2)'),('T2','Table for 2 · 0.60 × 0.60 (3)'),('T3','Garden table for 6 · 1.70 × 0.76 (1)'),('T4','Garden table for 2 · 0.70 × 0.60 (2)'),
          ('S1','Cane chair (15 + 2 spare)'),('S2','Velvet bar stool (4 + 1)'),('S3','Teak garden bench (2)'),('S5','Left sofa 2.55 × 0.50 (3 seats)'),('B1','Bar counter 2.20 × 0.75 × 1.04'),
          ('B4','Brass foot rail'),('B5','Back bar 2.65 × 0.40'),('B8','Brass glass-rack gantry (overhead)'),('B10','Server station 0.80 × 0.50'),
          ('B11','POS nook'),('D4','Portrait over the meter'),('D6','A-frame chalkboard'),('E1','Recessed coir mat'),('E2','Umbrella stand + coat hooks'),
          ('W2','Corner basin set'),('W4','WC set')]
    o=['<text x="0" y="0" font-size="14" font-weight="700" fill="#1B1714">KEY</text>']
    for i,(c,t) in enumerate(rows):
        y=28+i*26
        w=7.2*len(c)+10
        o.append(f'<rect x="0" y="{y-9}" width="{w:.0f}" height="18" rx="9" fill="#B5321C"/><text x="{w/2:.0f}" y="{y+4}" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">{c}</text><text x="40" y="{y+4}" font-size="12" fill="#2a2420">{t}</text>')
    return ''.join(o)

# =============================================================== CEILING PLAN
PEND=[]
for (cx,cz,n) in ((-2.0,0.975,1),(-1.5,0.975,1),(-2.0,2.625,1),(-1.5,2.625,1),(1.7,0.45,1),(1.7,1.425,1),(1.7,2.4,1),(-1.65,-1.62,1),(-1.65,-0.57,1),(1.5,-1.07,3)):
    for i in range(n):
        dz=0 if n==1 else (i-(n-1)/2)*0.34; dx=0 if n==1 else (0.07 if i%2 else -0.07)
        PEND.append((cx+dx,cz+dz))
LANT=[(0.25,0.85),(0.85,1.45),(0.4,1.95),(1.0,0.6),(0.15,2.35)]
LANT_Y=[3.25,2.9,3.6,3.5,2.85]
FANS=[(-0.45,1.5),(-0.45,3.9)]
FAN_R=0.6
def checks():
    out=[]
    for i,(fx,fz) in enumerate(FANS,1):
        d_p=min(math.hypot(fx-x,fz-z)-0.14-FAN_R for x,z in PEND)
        d_l=min(math.hypot(fx-x,fz-z)-0.13-FAN_R for x,z in LANT)
        gx0=0.38; d_g=gx0-(fx+FAN_R)                    # gantry nearest long edge
        d_wc=(fx-FAN_R)-(-1.2)                           # wash block aisle face (x -1.2, z >= 4.8; lobby at -1.45)
        out.append(f'F{i} at ({fx:+.2f}, {fz:.2f}): plan clearance to nearest pendant globe {d_p:.2f} m, to nearest lantern {d_l:.2f} m'+
                   (f', to gantry {d_g:.2f} m, to wash block face {d_wc:.2f} m' if i==2 else ''))
    return out

def ceiling():
    p=Pen(); base(p, True)
    # pendants
    for x,z in PEND: p.circ(x,z,0.14,'#f3d9a0','#8f6a2a',1.2); p.circ(x,z,0.05,'#ff9a40','#ff9a40',0.5)
    for (cx,cz) in ((-1.65,0.75),(-1.65,2.4),(1.6,0.75),(1.6,2.1)): p.tag(cx,cz+(0.55 if cx>0 else 0.55),'L1')
    p.tag(-1.5,-0.5,'L1'); p.tag(1.5,-0.5,'L1')
    for x,z in LANT: p.rect(x-0.11,x+0.11,z-0.11,z+0.11,'#d9b25a','#8a6420',1.2)
    p.tag(0.58,1.15,'L3','#8a6420')
    # fans
    for i,(fx,fz) in enumerate(FANS,1):
        p.circ(fx,fz,FAN_R,'none','#2a2420',1.4,'6 4'); p.circ(fx,fz,0.09,'#2a2420','#2a2420',1)
        for k in range(4):
            a=k*math.pi/2+0.5; p.line(fx,fz,fx+0.58*math.cos(a),fz+0.58*math.sin(a),'#2a2420',3)
        p.tag(fx,fz-0.8,f'C4·F{i}','#2a2420')
    # AC indoor units on walls
    p.rect(X0,X0+0.3,0.65,1.75,'#fff','#2a6f8f',1.6); p.tag(X0+0.55,1.2,'C1','#2a6f8f')
    for k in range(3): p.line(X0+0.32,0.85+k*0.35,X0+1.2,0.85+k*0.35,'#2a6f8f',1,'3 3')
    p.rect(-1.55,-0.45,KZ-0.3,KZ,'#fff','#2a6f8f',1.6); p.tag(-1.0,KZ-0.55,'C2','#2a6f8f')
    for k in range(3): p.line(-1.35+k*0.35,KZ-0.35,-1.35+k*0.35,KZ-1.3,'#2a6f8f',1,'3 3')
    # gantry strips + downlights
    p.rect(0.38,1.12,3.04,5.12,'none','#b8862a',1.8); p.line(0.38,3.04,0.38,5.12,'#ffb04a',3); p.line(1.12,3.04,1.12,5.12,'#ffb04a',3); p.tag(0.75,3.0,'L4','#8a6420')
    for z in (3.39,3.89,4.27,4.77): p.circ(0.75,z,0.06,'#fff','#8a6420',1.4)
    # back-bar strips
    p.line(X1-0.06,2.78,X1-0.06,5.3,'#ffb04a',4); p.tag(2.2,2.55,'L5','#8a6420')
    # track
    p.line(2.05,0.4,2.05,3.5,'#2a2420',4); p.line(2.1,5.3,2.1,6.2,'#2a2420',4)
    for k in range(4): z=0.4+(k+0.5)*3.1/4; p.circ(2.05,z,0.05,'#fff','#2a2420',1.4); p.line(2.0,z,1.6,z,'#b5321c',1,'2 2')
    for k in range(2): z=5.3+(k+0.5)*0.9/2; p.circ(2.1,z,0.05,'#fff','#2a2420',1.4)
    p.tag(2.2,1.95,'L6')
    # neon signs
    p.line(X1-0.04,2.92,X1-0.04,3.82,'#e0245e',5); p.tag(2.2,3.37+0.02,'L8','#e0245e')
    p.line(-1.78,4.66,-0.62,4.66,'#e0245e',5); p.tag(-1.2,4.46,'L8','#e0245e')
    p.line(-1.38,KZ-0.02,0.28,KZ-0.02,'#e0245e',5); p.tag(-0.55,KZ-0.2,'L8','#e0245e')
    p.line(-0.6,-0.33,0.6,-0.33,'#ff8a1f',5); p.tag(0,-0.55,'L7','#c4530f')
    # wall arm globes
    for z in (0.2,1.68): p.circ(X0+0.1,z,0.07,'#fff3c8','#3a3128',1.2)
    p.tag(-2.8,0.95,'L9','#8a6420')
    # speakers + TV
    p.rect(X0,X0+0.2,0.1,0.3,'#222','#222',1); p.tag(X0+0.5,0.45,'V1','#4a4a4a')
    p.rect(X1-0.2,X1,2.15,2.35,'#222','#222',1); p.rect(X1-0.2,X1,5.7,5.9,'#222','#222',1); p.tag(X1-0.5,2.0,'V1','#4a4a4a'); p.tag(X1-0.5,6.05,'V1','#4a4a4a')
    p.rect(X1-0.06,X1,3.0,3.74,'#222','#222',1); p.tag(X1-0.42,3.4,'V3','#4a4a4a')
    # washroom lights + exhaust
    p.circ(-2.1,4.0,0.07,'#fff','#8a6420',1.4); p.circ(-1.9,5.4,0.08,'#e6ecef','#2a6f8f',1.6); p.tag(-1.9,5.0,'L10','#8a6420'); p.tag(-2.1,3.45,'C8','#2a6f8f')
    # safety
    for (x,z) in ((X0+0.1,0.25),(X1-0.1,5.8),(-1.1,4.75)): p.circ(x,z,0.07,'#c8231b','#c8231b',1)
    p.rect(-0.2,0.2,0.05,0.2,'#2F7A5B','#2F7A5B',1); p.tag(0,0.38,'L12','#c8231b')
    # kitchen make-up air diffusers (outline only)
    for xa,xb,za,zb in ((-2.4,-1.8,7.0,7.5),(-0.95,-0.35,7.1,7.6)): p.rect(xa,xb,za,zb,'none','#3f6a3a',1.2,'3 2')
    # garden festoon + mist
    p.line(-GW+0.15,-0.4,GW-0.15,-0.4,'#d9b25a',2,'2 3'); p.line(-GW+0.15,-1.92,GW-0.15,-1.92,'#d9b25a',2,'2 3'); p.tag(0,-0.18,'L11','#8a6420')
    for x in range(-4,5): p.circ(x*0.6+0.05,-1.92,0.03,'#7fb7e0','#2a6f8f',1)
    p.rect(-GW+0.1,-GW+0.3,-1.99,-1.8,'#2a6f8f','#2a6f8f',1); p.rect(GW-0.3,GW-0.1,-1.99,-1.8,'#2a6f8f','#2a6f8f',1); p.tag(-GW+0.6,-2.15,'C5','#2a6f8f'); p.tag(GW-0.6,-2.15,'C5','#2a6f8f')
    p.text(0,-2.7,'pendants hang from the pergola rafters · mist line on the front beam',9,'#6a5d4e')
    return build('Reflected ceiling plan: lights, fans, ACs', 'Looking up at the ceiling. Pendants (L1), lanterns (L3), fans (C4), splits (C1, C2), gantry (L4), track (L6), neon (L7, L8), speakers (V1) · dashed = beams', p.o, 330, legend_ceil())

def legend_ceil():
    rows=[('L1','Jute globe pendant ×16','#B5321C'),('L3','Brass lantern ×5','#8a6420'),('L4','Gantry strips + 4 downlights','#8a6420'),('L5','Back-bar strips','#8a6420'),
          ('L6','Gallery track + 6 spots','#B5321C'),('L7','Neon · facade','#c4530f'),('L8','Neon · interior ×3','#e0245e'),('L9','Wall-arm globes ×2','#8a6420'),
          ('L10','Washroom lights','#8a6420'),('L11','Garden festoon + path','#8a6420'),('L12','Safety: 3 bulkheads, 2 exit signs','#c8231b'),
          ('C1','AC 2.0 TR front (indoor)','#2a6f8f'),('C2','AC 2.0 TR back (indoor)','#2a6f8f'),('C4','Ceiling fan 1200 mm ×2','#2a2420'),('C5','Garden mist fans + line','#2a6f8f'),
          ('C8','WC exhaust','#2a6f8f'),('V1','Wall speakers ×3','#4a4a4a'),('V3','TV 43"','#4a4a4a')]
    o=['<text x="0" y="0" font-size="14" font-weight="700" fill="#1B1714">KEY</text>']
    for i,(c,t,col) in enumerate(rows):
        y=28+i*26; w=7.2*len(c)+10
        o.append(f'<rect x="0" y="{y-9}" width="{w:.0f}" height="18" rx="9" fill="{col}"/><text x="{w/2:.0f}" y="{y+4}" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">{c}</text><text x="44" y="{y+4}" font-size="12" fill="#2a2420">{t}</text>')
    y=28+len(rows)*26+14
    import textwrap
    lines=[('Fan checks (plan view, edge of the sweep):',1)]+[(l,0) for c in checks() for l in textwrap.wrap(c,46)]
    for k,(line,b) in enumerate(lines):
        fw=' font-weight="700"' if b else ''
        o.append(f'<text x="0" y="{y+k*15}" font-size="10.5" fill="#6a5d4e"{fw}>{line}</text>')
    return ''.join(o)

if __name__=='__main__':
    out=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','img','furnishings')
    os.makedirs(out,exist_ok=True)
    open(os.path.join(out,'furniture-plan.svg'),'w').write(furniture())
    open(os.path.join(out,'ceiling-plan.svg'),'w').write(ceiling())
    print('\n'.join(checks()))
