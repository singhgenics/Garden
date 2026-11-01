#!/usr/bin/env python3
"""Furnishings schedule for Cabin East (Simplex concept 27: 4.9 x 8.8 m shell, 18 covers inside + 10 in the garden).
Writes furnishings.json for build.mjs. Sizes and positions come from the Simplex 3D model / plan (x runs from the right wall, -2.45,
to the left wall, +2.45; z from the shopfront, 0, to the back wall, 8.8). Prices are planning ranges in INR for 2026 (supply + fit, GST extra),
NOT quotes: get three quotes before ordering. lo/hi are per unit; 'lot' = one price for the whole line.
item = (code, name, size, material/finish, qty, unit, lo, hi, phase, where, note, image id or '')
phase 1 = needed to open; 2 = identity layers that can follow in the first months."""
import json, os

LAYERS = None  # filled below

G = []
def grp(gid, title, sub, items, img=''): G.append(dict(id=gid, title=title, sub=sub, img=img, items=[dict(zip(
    ['code','name','size','mat','qty','unit','lo','hi','phase','where','note','img'], it)) for it in items]))

grp('seating', 'Seating', 'Every seat is wipe-clean, felt or nylon-glided for the checker floor, and sized to the tight table gaps in the model (0.375 m on the sofa side, 1.0 m between the right-hand tables).', [
 ('S1','Cane-back dining chair','0.44 W × 0.46 D × 0.92 H · seat 0.46','Ash frame, walnut stain · open woven rattan back · 40 mm foam seat pad in leatherette (olive, orange, red, cream: never two the same at one table) · felt + nylon glides',17,'chairs',3800,6500,1,'8 at the right-hand tables, 3 at the sofa tables, 4 at the garden tables for 2 (15) + 2 spare','Same cane chair as the 3D model. Seat pad ties on, so pads are replaceable. Order the chairs from one maker in one batch so the stain matches. Garden chairs come in at night in the monsoon.','chair'),
 ('S2','Velvet high-back bar stool','Ø 0.42 seat · seat 0.76 H · back to 1.10 · 0.6 m centres','Performance velvet in sand (water-repellent, 50,000+ rubs) · brass-finish steel legs + foot ring · swivel with return',5,'stools',6500,9500,1,'Bar counter (4) + 1 spare','Seat 0.76 under a 1.04 top leaves 0.28 m for knees. Brass is lacquered, because Goa salt air tarnishes bare brass within weeks.','stool'),
 ('S3','Teak garden bench with backrest','1.70 W × 0.36 D · seat 0.45 · back 0.95','Plantation teak, oiled · A4 stainless screws · 40 mm outdoor foam cushion in solution-dyed acrylic (olive), removable',2,'benches',15000,21000,1,'Beer garden, either side of the table for 6 (3 seats each)','Cushions come in every night from June to September. Order 2 spare covers so one set is always dry.','bench'),
 ('S5','Left wall sofa','2.55 L × 0.50 D · seat 0.45 · back 0.90 · three 0.85 m seat bays','Plywood frame fixed to the wall, 100 mm high-resilience foam, washable fire-retardant performance fabric (floral, as in the model) · timber plinth, no legs to catch',1,'sofa',30000,50000,1,'Left wall, z 0.15–2.70, in front of the brick','One seat per table. The sofa is the tight side of the room: 0.375 m between the three tables, 0.3 m from the last chair to the bar island. Mock it up with real furniture first.',''),
 ('S4','Folding high chair','0.52 × 0.56 × 0.90 · foot rest + tray removed','Powder-coated steel + wipe-clean seat',1,'chair',4500,6500,2,'Folded at the server station','One is enough for 28 covers; guests who ask are served in minutes.',''),
], 'chair')

grp('tables', 'Tables', 'Plank tops on black steel trestles. Trestle ends are set 0.12 m in from the table ends so a chair never meets a leg.', [
 ('T1','Table for 4 · right wall','1.20 × 0.65 × 0.76 H · end-on to the wall','Solid acacia, 5 planks with 2 mm shadow gaps, 28 mm, eased edge · matte 2-pack PU lacquer (beer, soy and chilli oil wipe off) · two 40 × 8 mm flat-steel trestle ends, black powder coat, levelling feet',2,'tables',9500,14000,1,'z 0.65–1.30 and 2.30–2.95, x −2.45 to −1.25','1.0 m between the pair so the chairs of both tables fit between them. Ask the maker to seal the underside and end grain too, or the humidity will cup the top.','table'),
 ('T2','Table for 2 · left sofa','0.60 × 0.60 × 0.76 H · square','As T1 (single trestle pair)',3,'tables',6500,9000,1,'z 0.15–0.75, 1.125–1.725 and 2.10–2.70, x 1.40–2.00','Standard square café size, 0.375 m apart. Movable, so the three can be pushed together for a party of 6.',''),
 ('T3','Garden table for 6','1.70 × 0.76 × 0.78 H','Plantation teak, slatted top with 8 mm gaps for rain · square legs · A4 stainless fixings · oiled',1,'table',19000,28000,1,'Beer garden, left half, x 1.12–1.88, z −1.92 to −0.22','Three seats a side on the two benches (S3). Slatted so rain drains through and a spilled pint does not pool.','bench'),
 ('T4','Garden table for 2','0.70 × 0.60 × 0.76 H','Plantation teak, slatted top · A4 stainless fixings · oiled',2,'tables',8000,12000,1,'Beer garden, right half over the biodigester, x −2.00 to −1.30, 0.45 m apart','Cane chairs (S1) either side. Keep the weight modest: the biodigester cover is below.','bench'),
 ('T5','Enamel table-number plate','Ø 0.06 · screwed into the top','Porcelain enamel on steel, Cabin East orange with cream numerals',9,'plates',250,400,1,'One per table (5 inside + 3 garden) + 1 spare','Numbers match the order tickets. Same enamel as the three Cabin East signs.','tabletop'),
 ('T6','Cordless LED table lamp','Ø 0.09 × 0.19 H · rechargeable','IP54 matte-white and brass, 2200 K, touch dimmer, 8-hour battery, drop-in charging tray',10,'lamps',1400,2600,1,'5 indoor tables (1 each), garden table for 6 (2), garden tables for 2 (1 each) + 1 spare','The glow on the table is the lamp in the 3D model. Charged on a tray in the server station each afternoon.','tabletop'),
])

grp('bar', 'Bar, back bar & service', 'The bar is the room\'s signature: a glowing front, marble top, brass rail and a floating glass rack. Equipment (kegs, chiller, ice, glasswasher) is on the Simplex quotes sheet; this list is what you see and touch.', [
 ('B1','Bar counter carcass','2.20 L × 0.75 D × 1.04 H · square end towards the door','18 mm marine ply on a 40 × 40 steel frame, olive-green lacquer back, laminated bartender side · 0.10 toe kick · built around the 1.10 × 0.63 × 0.90 keg cabinet (louvred doors)',1,'lot',55000,80000,1,'x 0.35–1.20, z 2.94–5.22','Wet side: marine ply only, edges sealed. Keg-cabinet louvres stay clear for the chiller to breathe.','barfront'),
 ('B2','Bar top','2.20 × 0.75 × 0.03 · 12 mm eased edge · 0.25 overhang for knees','Honed white Makrana marble, impregnating sealer · re-seal every 6 months',1,'lot',20000,38000,1,'On B1','Marble etches under lime, tamarind and soju. If that worries you, a sintered-stone top costs about the same and does not stain.','barfront'),
 ('B3','Bar front panels','3 panels · 0.90 H · framed in black steel','Black brass-wire mesh over amber translucent onyx-look panels, back-lit with a 2700 K LED strip (24 V, dimmable) · LED kick-strip below',1,'lot',38000,65000,1,'Guest side of B1','Real onyx works but costs 3 times as much. The resin panel gives the same glow and is easier to replace if cracked.','barfront'),
 ('B4','Brass foot rail','Ø 0.05 × 2.0 L · 0.22 above the floor · 3 brackets','Solid brass tube, clear-lacquered, bolted to the steel frame',1,'rail',9000,15000,1,'Guest side of B1','Lacquer, not bare brass. 0.22 m suits a 0.76 seat.','barfront'),
 ('B5','Back bar cabinetry','2.65 L × 0.40 D × 0.96 H · POS nook, CO₂ cabinet, mixers cooler, glasswasher bays','Olive-green lacquer doors on marine ply, honed marble top, brass pulls · cut-outs for the built-in equipment',1,'lot',70000,105000,1,'x 2.05–2.45, z 2.72–5.37','Fridge and glasswasher stay 50 mm clear of the walls for ventilation.','service'),
 ('B6','Emerald back-bar tile','≈ 2.65 × 1.50 m (about 4 m²)','20 × 20 mm glass mosaic in emerald, grey grout, epoxy grout at the sink end',1,'lot',30000,55000,1,'Wall over B5','The one colour hit in the room besides the brick.','hero-bar'),
 ('B7','Floating shelves','3 × 2.00 L × 0.28 D · 0.28 / 0.62 / 0.96 above the counter','Ash with brass edge, hidden steel brackets, 2700 K LED strip under each',3,'shelves',6000,10000,1,'Over B5','Bottles at eye height, glassware on top, soju riser at the far end.',''),
 ('B8','Brass glass-rack gantry','1.8 L × 0.74 W · lower tier 2.30 m (stemware hangs by the foot), upper glass shelf 2.58 m','Lacquered brass frame, glass shelf, hung from the slab on four Ø 8 black steel rods',1,'lot',38000,62000,1,'Over the bar, x 0.38–1.12, z 3.04–5.12','Hangs from the slab: chemical anchors M10, rated for 60 kg with glassware. Have the engineer sign off the anchors.','gantry'),
 ('B9','"On Tap" chalkboard + soju riser','0.50 × 0.70 board · 0.60 riser','Black steel frame, chalk paint · ash riser',1,'set',6000,12000,2,'Back bar, far end','',''),
 ('B10','Server station','0.80 L × 0.50 D × 0.94 H · shelves at 1.60 and 1.95','Olive cabinet, marble top, two ash shelves · space for the coffee brewer, water dispenser and 40 glasses',1,'lot',28000,45000,1,'x 1.95–2.45, z 5.45–6.25 (left wall, by the kitchen door)','Two steps from the kitchen door. Table lamps charge here.','service'),
 ('B11','POS nook','0.48 W × 0.40 D recess in the back bar · 0.96–1.34 H','Ash lining, tablet arm, receipt-printer shelf, cash drawer, small safe below',1,'lot',12000,20000,1,'Back bar door end','Tablet, card machine and printer are on the quotes sheet.',''),
])

grp('lighting', 'Lighting', 'Five layers on five circuits, all warm and all dimmable except the safety lights. Every bulb in the jute globes is LED: jute and ivy never sit near a hot lamp.', [
 ('L1','Jute globe pendant','Ø 0.28 · 2 m rope drop, E27 holder, ceiling rose','Hand-woven jute over a steel ring, black cord set · one drop over each indoor table position, a cluster of 3 at three heights (0.95 / 1.15 / 1.03 above the top) over the garden table for 6',12,'pendants',1600,2800,1,'7 indoor (right tables 2 each, sofa tables 1 each) + 5 in the garden (3 + 1 + 1)','Jute is flammable: LED filament only, flame-retardant spray on the globes, 5 cm clear around the bulb.','pendants'),
 ('L2','Spiral filament LED lamp','E27 · 4 W · 2200 K · dimmable · CRI 90','Clear glass spiral filament',23,'lamps',180,320,1,'12 pendants + 5 lanterns + 6 spares','Buy a 20% spare batch with the first order. Filament shapes change between batches.',''),
 ('L3','Brass hanging lantern','Ø 0.22 × 0.30 · 5 at 2.85–3.60 m','Hexagonal brass, ribbed amber glass, E27 4 W filament · on black rods from the slab',5,'lanterns',3500,6500,2,'Over the entry path, x 0.15–1.00, z 0.6–2.35','Hung at three heights beside the spiral duct. Clear of the fan sweep.','hero-room'),
 ('L4','Gantry lighting','2 × 2.0 m strips · 4 downlights','2200 K LED strip 9.6 W/m under both long sides · four Ø 0.035 brass downlights, 3 W',1,'lot',8000,14000,1,'Gantry (B8)','Amber wash on the marble and the hanging glass.','gantry'),
 ('L5','Back-bar shelf lighting','3 × 2.65 m strips · 2 picture lights','2700 K LED 9.6 W/m in aluminium channel, diffuser · brass picture lights over the board',1,'lot',7000,12000,1,'Over B5','Hidden channels on the underside of each shelf.',''),
 ('L6','Black track + gallery spots','Track 3.1 m + 0.9 m · 6 spots 7 W · 24° · 2700 K · CRI 90','Black surface track on the left wall at the ceiling · adjustable heads aimed at the gallery wall',1,'lot',16000,26000,1,'Left wall x 2.05, z 0.4–3.5 and 5.3–6.2','Aim each spot so light falls on the frame, not the guest.','neonwall'),
 ('L7','Neon sign · facade "Cabin East"','2.10 × 0.82 · IP67','12 V LED neon flex in a clear acrylic backing, Cabin East orange, 40 W',1,'sign',45000,75000,1,'Shopfront fascia, outside','Outdoor and coastal: marine seal at every joint. On a timer.',''),
 ('L8','Neon signs · interior','"settle up here" 0.90 × 0.20 · "bao, baby?" 1.15 × 0.32 · "stay a little longer" 1.66 × 0.28','12 V LED neon flex, 2200–2700 K, 8–12 W/m',3,'signs',9000,20000,2,'POS nook (left wall) · hung from the beam at z 4.66 · kitchen upper wall','Phase 2: the room works without them; the bar and pendants carry the evening.','neonwall'),
 ('L9','Wall-arm globe lamp','Ø 0.10 globe on a 0.12 black arm · 1.72 m','Opal glass, black steel, 4 W filament',2,'lamps',2500,4200,2,'Right wall, z 0.2 and 1.68','Soft light over the hooks and the entry.','entry'),
 ('L10','Washroom lights','2 × 7 W 3000 K downlights · LED ring mirror · corner pendant globe','IP44 downlights, ring mirror 12 W, globe at 2.2 m over the basin',1,'lot',6000,11000,1,'Hand-wash lobby + WC','IP44 minimum: the basin is under a pendant.',''),
 ('L11','Garden lighting','2 × 10 m festoon (20 × G40 bulbs, 12 V, IP65) · 4 path lights 1 W · chalkboard spot','2200 K LED bulbs on black wire between the posts and the facade · stainless path lights',1,'lot',12000,20000,1,'Pergola + path','Low voltage, on its own RCD circuit, because it is outdoors.','hero-garden'),
 ('L12','Safety lights','3 emergency bulkheads (3 h) · 2 exit signs','Maintained LED, self-test',1,'lot',9000,15000,1,'Entry, left wall by the kitchen door, washroom aisle · exit over the door and at the rear exit','Not dimmable and not on any scene. See the Safety view of the 3D model.',''),
 ('L13','Lighting controls','2 trailing-edge LED dimmers · scene keypad · astronomical timer for signs','Wall keypad by the POS nook: Lunch, Evening, Late, Close',1,'lot',18000,32000,1,'POS nook wall','Trailing-edge dimmers only, or the filament bulbs will buzz.',''),
 ('L14','Kitchen lights','3 × 600 × 600 LED panels 36 W · 2 hood lights 10 W IP65','IP44 panels, 4000 K, in the cement-board ceiling',1,'lot',7000,12000,1,'Kitchen','Cool white so the chef reads colour. See the kitchen sheets.',''),
])

grp('climate', 'Air, fans & ventilation', 'Two ACs cool the room; two slow fans mix the air so the AC can run at 26 °C instead of 24. Everything that is hot and noisy sits on the side strip, because the flats are above.', [
 ('C1','Split air conditioner 2.0 TR · front','Indoor 1.1 × 0.34 × 0.25 · centre at 3.95 m on the right wall (z 1.2)','Inverter, 5-star, R32, Wi-Fi, high-wall · condensate piped out to the side strip · outdoor unit 0.80 × 0.55 × 0.30 on the right wall at 3.0 m',1,'unit',68000,85000,1,'Right wall, z 1.2 · outdoor unit on the side strip','Ask for the anti-corrosion (blue-fin) coil: Goa is salt air. Not on backup power.','fan-ac'),
 ('C2','Split air conditioner 2.0 TR · back','Indoor 1.1 × 0.34 × 0.25 · centre at 3.1 m on the kitchen front wall (x −1.0)','As C1',1,'unit',68000,85000,1,'Kitchen front wall, x −1.0','Throws down the room towards the bar, over the washroom block.',''),
 ('C3','AC installation','2 sets · piping, drain, wiring, stand, commissioning','Insulated copper, UV-proof cover, drain trap',2,'sets',9000,14000,1,'Side strip + walls','Condensate goes to the grey-water line, not onto the road.',''),
 ('C4','Ceiling fan · BLDC 1200 mm','Blade 2.75 m above the floor · 1.4 m downrod · 28 W','Matte-black body, ash blades, 6 speeds + reverse, remote · rubber isolator at the slab',2,'fans',6500,11000,1,'F1 at x −0.45, z 1.50 · F2 at x −0.45, z 3.90','Run on speeds 1–2 with the AC on. Plan clearance: 0.59 m to the nearest pendant, 0.23 m to the nearest lantern (which hangs above the blade plane). Mount on rubber isolators and a hanger rated for the dynamic load: the slab is the neighbours\' floor.','fan-ac'),
 ('C5','Garden mist fans + misting line','2 post-mounted fans (Ø 0.40, IP, 60 W) · 9 nozzles every 0.6 m on the front beam','Stainless line, brass nozzles, high-pressure pump, softened feed',1,'lot',21000,37000,2,'Pergola posts + front beam','Use the softened water so the nozzles do not scale.','hero-garden'),
 ('C6','Clear PVC roll-down curtains','3 sides · about 22 m²','1.5 mm UV-stable PVC, stainless eyelets, side guides, top rail',1,'lot',18000,30000,1,'Garden, front 5.3 m + two 2.0 m sides','Needed from June to September.',''),
 ('C7','Air curtain over the entry (optional)','1.2 m · 90 W','Slim, black, recessed over the door line',1,'unit',9000,15000,2,'Above the shopfront doors','Optional: cuts cold loss and mosquitoes at each door opening.',''),
 ('C8','WC exhaust fan','Inline Ø 100 · 30 W','Ceiling grille + duct to the back wall, high',1,'fan',3000,5000,1,'Washroom ceiling','Away from the gas cage. See the Simplex model.',''),
])

grp('finishes', 'Floors, walls & ceiling', 'What the 3D model already shows, with the actual spec for the contractor. Usually priced in the interior contract, shown here so nothing is missed.', [
 ('F1','Dining + bar floor','≈ 30 m² incl. 10% wastage · 600 × 600 mm','Matt porcelain checker, charcoal #2B2B2B and warm white #E9E4D8, R11 anti-slip, 2 mm joint, laid square',30,'m²',1300,2000,1,'Dining room, bar, entry','R11, because beer and rain meet the entry.','materials-a'),
 ('F2','Brick wall, left','≈ 24 m² · 12 mm','Burnt-red brick slips, off-white lime pointing, matt sealer',24,'m²',1400,1900,1,'Left wall + bar end','Seal against beer spray; no glossy sealer.','hero-room'),
 ('F3','Reclaimed-wood wall, right','≈ 10 m² · 12–15 mm planks','Reclaimed teak / mixed plank, fire-retardant clear coat, vent gap behind at the meter',10,'m²',2400,3800,1,'Right wall z 0.04–2.28','Fire-retardant coat is not optional. Keep 0.05 m gap from the AC.',''),
 ('F4','Lime-wash plaster + paint','Whole room above the dado','Cream lime-wash, matt, washable to 1.2 m',1,'lot',25000,45000,1,'Walls not covered above','',''),
 ('F5','Acoustic clouds + panels','4 clouds 1.2 × 1.2 m · 5 panels 0.6 × 1.2 m','50 mm mineral wool, NRC 0.85, fabric-wrapped, hung on cables',1,'lot',45000,70000,2,'Every bay of the ceiling · back wall','Brick, tile and glass make a loud room; panels do most for the neighbours too.',''),
 ('F6','Washroom tiles','Walls to 2.1 m, floor','300 × 600 gloss white wall · 300 × 300 R10 floor',1,'lot',25000,40000,1,'Washroom + lobby','',''),
 ('F7','Garden floor','10.6 m² · 600 × 600','Matt terracotta-look porcelain, R11, fall 1 in 60 to the road',11,'m²',1200,1900,1,'Beer garden','Slot drain at the shopfront.',''),
])

grp('decor', 'Art, signs & plants', 'The identity layer: Cabin East enamel signs, framed posters, a BAO mural, and plants that survive a Goa monsoon.', [
 ('D1','Gallery wall','14 frames, A3–A2 · track-lit','Black timber frames, acrylic glazing, vintage enamel-sign prints',1,'lot',22000,40000,2,'Left wall, z 0.4–3.5','Print from the Cabin East brand pack; keep one frame empty for a future poster.','neonwall'),
 ('D2','Cabin East enamel signs','WOK, STEAM, DRAUGHT hung 0.38 × 0.157 (as in the model) + wall signs','Porcelain enamel on steel, brand colours',8,'signs',2200,3800,2,'Right wall + over the bar','Colour and wording are in the Cabin East brand pack.','neonwall'),
 ('D3','BAO mural','1.6 × 1.0 · hand-painted','Mineral paint on lime plaster, matt varnish',1,'lot',18000,35000,2,'High on the washroom block wall','Local artist; keep a 0.10 margin from the beam.',''),
 ('D4','Portrait over the meter','0.60 × 0.80 · hinged','Brass frame, piano hinge, lift-off keeper',1,'unit',6000,10000,1,'Right wall, z 0.78','The meter must stay reachable for the electricity department.',''),
 ('D5','Plants','Artificial trailing ivy 20 m (FR, UV) · real lemongrass, bougainvillea, ixora in the garden planters','Fire-retardant ivy indoors, real plants outside',1,'lot',14000,25000,1,'Pendants, gantry, garden planters','Real ivy does badly in AC; the model\'s trailing ivy is artificial.','hero-garden'),
 ('D6','A-frame chalkboard','0.64 × 1.00','Black steel, chalk paint, rain cover',1,'unit',3500,6000,1,'Garden path','Menu of the day at the road.',''),
])

grp('entry', 'Entry & everyday', 'Small things that decide whether the room feels cared for in July.', [
 ('E1','Recessed coir door mat','1.4 × 0.9','Coir with rubber back, recessed into the tile',1,'mat',2500,4500,1,'Inside the doors','',''),
 ('E2','Umbrella stand + coat hooks','Ø 0.25 × 0.60 · 6 brass hooks on a 1.0 m rail','Black steel, solid brass',1,'set',3000,6000,1,'Right wall at the entry','Monsoon: guests arrive wet.','entry'),
 ('E3','Under-bar bag hooks','4 brass hooks','Solid brass, one per stool',4,'hooks',300,600,1,'Under the bar overhang','',''),
 ('E4','Pedal bins','30 L · 2','Stainless, soft-close, lined',2,'bins',2000,3500,1,'Bar + server station','',''),
])

grp('av', 'Sound, screen & security', 'Speakers sit on rubber pads on the walls: no bass speaker on the slab.', [
 ('V1','Wall speakers','3 · 0.22 × 0.34 · 40–60 W','Black passive, on rubber isolation brackets',3,'speakers',6000,12000,1,'Right wall z 0.2 · left wall z 2.25 and z 5.8','',''),
 ('V2','Amplifier + Wi-Fi streamer','2-channel · rack under the back bar','Commercial 2 × 50 W with limiter',1,'set',22000,38000,1,'Back bar','A limiter protects the neighbours.',''),
 ('V3','TV 43"','0.96 × 0.56 · tilt bracket','Commercial LED',1,'unit',26000,38000,2,'Left wall, 3.6 m, z 3.37','Sound off; captions on.',''),
 ('V4','CCTV','6 cameras + NVR 2 TB','IP cameras',1,'lot',32000,52000,1,'Entrance, till, back, rear exit, garden, side yard','',''),
])

grp('washroom', 'Washroom & hand-wash', 'Tiny, so every fitting is chosen for a small footprint.', [
 ('W1','Pop-art face mirror','0.9 × 1.2 · two Ø 0.14 LED ring mirrors as eyes','Custom acrylic-and-brass',1,'lot',10000,18000,2,'Hand-wash lobby','','washroom'),
 ('W2','Corner basin set','Triangular 0.42 · rim 0.85','Wall-hung ceramic · single-lever tap · wall soap dispenser',1,'set',9000,16000,1,'Lobby front corner','','washroom'),
 ('W3','Paper-towel dispenser + pedal bin','Compact-fold · 10 L','Stainless',1,'set',3000,5500,1,'Lobby','','washroom'),
 ('W4','WC set','0.62 deep short-projection, back-to-wall · slim cistern · health faucet · roll holder','White ceramic',1,'set',12000,22000,1,'Washroom','0.53 m of knee room: do not fit a deeper WC.',''),
 ('W5','Telescopic sliding door','2 panels 0.39 × 2.05 · 0.70 clear · soft-close','Solid-core, lock-linked occupied light',1,'set',14000,24000,1,'Lobby wall','',''),
 ('W6','Small wall basin + mirror','0.33 × 0.25','Wall-hung',1,'set',5000,9000,1,'Inside the WC','',''),
])

def totals():
    out=[]
    for g in G:
        lo=hi=0;lo1=hi1=0
        for it in g['items']:
            l,h=it['qty']*it['lo'],it['qty']*it['hi']
            it['tlo'],it['thi']=l,h
            lo+=l;hi+=h
            if it['phase']==1: lo1+=l;hi1+=h
        g['tlo'],g['thi'],g['p1lo'],g['p1hi']=lo,hi,lo1,hi1
    return out
totals()

# ---- lighting design numbers (watts are connected load) ----
WATTS=[('Pendants (12 × 4 W)',48),('Lanterns (5 × 4 W)',20),('Gantry strips + downlights',50),('Back-bar strips + picture lights',92),('Bar front + kick LED',40),
 ('Track spots (6 × 7 W)',42),('Neon: facade + 3 interior',115),('Wall-arm globes (2 × 4 W)',8),('Washroom',33),('Garden: festoon, path, chalkboard',50),('Safety lights',10),('Kitchen panels + hood lights',128)]
SCENES=[('Lunch','12:00–16:00','70%','50%','off','60%','off'),('Evening','18:00–21:30','60%','80%','on','80%','on'),('Late','21:30–close','40%','80%','on','60%','on'),('Close','cleaning','100%','100%','off','100%','off')]
LUX=[('Dining tables','100–150 lux at the table top, 2200 K','Pendants + lamps'),('Bar guest side','100–150 lux on the marble','Gantry + front glow'),('Bartender side','300 lux on the work surface','Back-bar strips + downlights'),
     ('Entry + aisle','50–100 lux on the floor','Spill + lanterns + wall globes'),('Kitchen','500 lux','Panels + hood lights'),('Washroom','150 lux','Downlights + ring mirror')]
CIRCUITS=[('A','Pendants (all)','2-channel dimmer','0–100%'),('B','Bar: gantry, front glow, back bar','dimmer','0–100%'),('C','Gallery track + lanterns','switch + dimmer','0–100%'),
          ('D','Neon signs','timer','on/off'),('E','Garden: festoon, pendants, path','own RCD','switch'),('F','Kitchen, washroom, server','switch','on/off'),('G','Safety','always on','—')]

GALLERY=[
 ('The room','The dining room by day, by evening and late, and from the street.',[('hero-room','From the door, evening'),('room-from-bar','Back towards the street'),('room-lunch','Lunch: daylight, pendants low'),('room-late','Late: neon and 40% light'),('facade','The facade at dusk')]),
 ('The bar','Counter, back bar, glass rack and the service corner.',[('hero-bar','The bar'),('bar-from-door','From the entrance'),('barfront','Front panel, marble and brass rail'),('bar-taps','Brass tap tower, three taps'),('backbar-detail','Back bar: shelves, board, POS nook'),('bartender-side','Bartender side'),('gantry','Floating brass glass rack'),('service','Server station'),('pass-view','The pass and the kitchen door')]),
 ('Tables & seating','Every chair, stool, bench and table, in place and on their own.',[('table-left','Left window tables'),('booth-right','Right window tables'),('table-dimsum','A table laid for dim sum'),('chair','S1 cane-back chair'),('stool','S2 velvet bar stool'),('table','T1 plank table'),('bench','S3 + T4 teak garden set'),('tabletop','Table-top set: lamp, number, caddy')]),
 ('Lighting','Pendants, lanterns, neon and the gallery track.',[('pendants','Jute globe pendants'),('lanterns','Brass lanterns by the spiral duct'),('neonwall','"settle up here" and the gallery wall'),('neon-bao','"bao, baby?" on the beam')]),
 ('Air & fans','Double height, slow fans, a high split AC.',[('fan-ac','Ceiling fan and split AC'),('ceiling-beams','Beams, clouds and gantry from below')]),
 ('Walls, floors & art','Brick, checker, emerald mosaic, enamel signs and the BAO mural.',[('materials-a','Material board 1: surfaces'),('materials-b','Material board 2: metal, fabric, fittings'),('detail-floor-brick','Checker floor meets brick'),('detail-mosaic','Emerald mosaic and marble'),('detail-signs','Cabin East enamel signs'),('mural-bao','BAO mural')]),
 ('Entry & washroom','Where guests arrive wet, and the tiny hand-wash lobby.',[('entry','Entry: mat, umbrellas, hooks'),('washroom','Hand-wash lobby'),('wc-door','Sliding WC door from the aisle')]),
 ('Beer garden','Pergola, teak, mist and monsoon curtains.',[('hero-garden','Dusk'),('garden-day','Afternoon'),('garden-monsoon','Monsoon, curtains down'),('garden-mist','Mist fan and misting line')]),
 ('Plans','Both plans are vector drawings; open them full size.',[('furniture-plan','Furniture & finishes plan'),('ceiling-plan','Ceiling plan: lights, fans, ACs')]),
]

def item(code):
    return next(i for g in G for i in g['items'] if i['code']==code)
def span(codes, k=1.0):
    lo=sum(item(c)['tlo'] for c in codes)*k; hi=sum(item(c)['thi'] for c in codes)*k; return round(lo,-3),round(hi,-3)
def saves():
    p2=[i for g in G for i in g['items'] if i['phase']==2]
    return [
     ('Open without the phase 2 lines',f"{len(p2)} lines (L3, L8, L9, D1–D3, F5, C5, C7, S4, B9, W1, V3) wait for the first months.",round(sum(i['tlo'] for i in p2),-3),round(sum(i['thi'] for i in p2),-3)),
     ('Gantry (B8 + L4) as the first upgrade',"The bar still glows from the front panel and back bar; hang the glass rack once trade is steady. Plan the four slab anchors now.")+span(['B8','L4']),
     ('Garden set in sealed acacia instead of teak',"About 30% cheaper; expect to re-oil twice a year and replace in 4–5 monsoons instead of 10+.")+span(['S3','T4'],0.3),
     ('Bar front in laminate with an LED strip',"Skip the mesh and onyx panels; keep the marble and the brass rail. Saves about half of B3 but loses the glow.")+span(['B3'],0.5)]
def design_checks():
    from furnishing_plans import checks
    return [
     ('Fans against pendants and lanterns','; '.join(checks())+'. Blade 2.75 m, rod 1.4 m. Re-check on site with the spiral duct and the real pendant drops.'),
     ('Bar knees','Seat 0.76 under a 1.04 counter leaves 0.28 m; the brass rail at 0.22 m is within a seated foot\'s reach.'),
     ('Tight seating','The sofa side is tight on purpose: three 0.6 × 0.6 tables 0.375 m apart, 0.3 m from the last chair to the bar island, and a central aisle of about 2.2 m. The right-hand tables are 1.0 m apart with a chair pair on each long side. Mock both runs up on site with real tables and chairs, and survey the shell, before ordering any seating.'),
     ('Fire','Jute globes, ivy, reclaimed wood and the facade neon all burn or sit near wiring. Specified: LED filament only (4 W), flame-retardant spray on the jute, fire-retardant ivy, fire-retardant clear coat on the reclaimed wood. Confirm the finishes with the fire NOC advisor before ordering.'),
     ('Salt air','Lacquered brass, marine-grade powder coat, A4 stainless outside, blue-fin coil on the ACs. Bare brass and mild steel go green and rust within one monsoon.'),
     ('The flats above','Fans on rubber isolators, speakers on rubber pads with a limiter, no bass speaker on the slab, AC outdoor units and exhaust on the side strip.'),
     ('Humidity','Seal the underside and end grain of every timber piece, use performance velvet, seal the marble, and run the AC on dry mode overnight in the monsoon so the pendants and chairs do not mould.'),
     ('Prices','Planning ranges for Goa in 2026, supply and fit, GST extra, from typical Indian trade rates. They are not quotes. Get three quotes per line, and treat anything with a custom maker (bar, gantry, neon, mural) as ±25%.')]

def main():
    here=os.path.dirname(os.path.abspath(__file__))
    allv=sum(g['tlo'] for g in G),sum(g['thi'] for g in G)
    p1=sum(g['p1lo'] for g in G),sum(g['p1hi'] for g in G)
    data=dict(groups=G,total=dict(lo=allv[0],hi=allv[1],p1lo=p1[0],p1hi=p1[1]),watts=WATTS,wattTotal=sum(w for _,w in WATTS),scenes=SCENES,lux=LUX,circuits=CIRCUITS,saves=saves(),checks=design_checks(),gallery=GALLERY)
    json.dump(data,open(os.path.join(here,'furnishings.json'),'w'),ensure_ascii=False)
    n=sum(len(g['items']) for g in G)
    print(f'furnishings.json: {len(G)} groups, {n} lines, total ₹{allv[0]/1e5:.1f}–{allv[1]/1e5:.1f} lakh (phase 1 ₹{p1[0]/1e5:.1f}–{p1[1]/1e5:.1f} lakh), lighting {sum(w for _,w in WATTS)} W')
if __name__=='__main__': main()
