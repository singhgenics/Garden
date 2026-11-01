import json
# id, section, name, subtitle, refs(list of crockery image ids), vessel label, image-prompt, build steps, garnish, sauce/side, serve temp, kitchen note
F = []
def add(id, sec, name, sub, refs, vessel, prompt, build, garnish, side, temp, note, gen=True):
    F.append(dict(id=id, sec=sec, name=name, sub=sub, refs=refs, vessel=vessel, prompt=prompt,
                  build=build, garnish=garnish, side=side, temp=temp, note=note, gen=gen))

# ---------------------------------------------------------------- FOOD
add('wonton','Soups','Wonton Kenobi','Chicken wonton soup',['soup'],'Soup bowl on a side plate, porcelain spoon',
 'a stoneware soup bowl on a cream side plate holding clear golden ginger-chicken broth with five plump chicken wontons floating, a wilted bok choy half, spring onion rings and a dusting of white pepper, a white porcelain soup spoon resting on the plate edge',
 ['Warm the bowl with hot water and tip it out.','Lay the bok choy half on the left of the bowl.','Slip in five poached wontons, pleats up.','Ladle clear broth to 1 cm below the rim.'],
 'Spring onion rings, white pepper','Porcelain spoon on the side plate','Piping hot, 75 °C','One bowl, one person. Keep the broth clear: never boil the wontons in it.')
add('hotsour','Soups','Hot & Bothered','Hot & sour, veg or chicken',['soup'],'Soup bowl on a side plate, porcelain spoon',
 'a stoneware soup bowl on a cream side plate holding glossy dark hot and sour soup with swirled egg ribbons, shredded mushroom, bamboo shoot and tofu cubes, a dusting of white pepper and spring onion greens on top, a white porcelain soup spoon on the plate',
 ['Warm the bowl.','Ladle soup to 1 cm below the rim, stirring once so the solids are even.','Swirl the egg ribbons to the surface.','Finish with a splash of black vinegar.'],
 'White pepper, spring onion greens','Chilli vinegar from the caddy','Piping hot, 75 °C','Chicken version: add the shredded chicken before the soup. Pepper goes on last so it stays sharp.')
add('tomkha','Soups','Coconut Cuddle','Tom kha, veg or chicken',['soup'],'Soup bowl on a side plate, porcelain spoon',
 'a stoneware soup bowl on a cream side plate holding pale creamy coconut tom kha soup with sliced mushrooms, a bruised lemongrass piece, torn lime leaf, red chilli slices and coriander leaves on top, a white porcelain spoon on the plate',
 ['Warm the bowl.','Place mushrooms and the protein in the centre.','Pour the hot coconut broth over them to order.','Finish with lime juice.'],
 'Red chilli slices, coriander, lime leaf','Lime wedge on the side plate','Piping hot, 75 °C','Do not let coconut milk boil hard or it splits. Pull the lemongrass piece out before serving if guests object.')
add('cabinfever','Cabin starters','Cabin Fever','Chilli, dry: paneer, chicken or pork',['enplate'],'10" enamel plate',
 'dry chilli chicken: crisp golden double-fried chicken pieces tossed with green chilli rings, onion and capsicum squares and a glossy dark soy glaze, piled loosely in a low mound on the white enamel plate with olive rim from the reference image, spring onion greens on top, a small ceramic dish of sliced green chillies in vinegar beside it',
 ['Warm the plate.','Toss the fried protein in the wok on full flame until the sauce catches.','Heap in a low mound, off-centre, so the rim shows.','Scatter onion and capsicum over the top.'],
 'Spring onion greens','Green chillies in vinegar in a dipping dish','Hot from the wok','Pork version is braised belly, plated the same way. Sauce should cling, never pool.', gen=False)
add('honeytrap','Cabin starters','Honey Trap','Honey chilli, potato or chicken',['enplate'],'10" enamel plate',
 'honey chilli potato: golden twice-fried potato fingers coated in a sticky glossy honey-chilli glaze with sesame seeds, red chilli flakes and spring onion rings, stacked loosely in a mound on the white enamel plate with olive rim from the reference image',
 ['Warm the plate.','Toss twice-fried fingers in the hot glaze for 10 seconds.','Stack criss-cross so air gets under them.','Spoon any glaze left in the wok over the top.'],
 'Toasted sesame, chilli flakes, spring onion','Cocktail sticks at the bar','Hot from the wok','A sticky glaze goes soft in a basket, so it stays on a plate. Send within a minute of glazing.')
add('saltpepa','Cabin starters','Salt & Pepa','Salt & pepper: mushroom, chonak or prawns',['basket'],'Paper-lined fry basket',
 'salt and pepper fried prawns: five golden crisp prawns tossed with garlic crumbs, crushed black pepper, green chilli rings and spring onion, in a black wire basket lined with kraft greaseproof paper, a small ceramic dish of pale kasundi mayo beside it',
 ['Line the basket with a sheet of greaseproof paper, corners up.','Fry the protein once, drain on a rack for 10 seconds.','Toss with salt, pepper and garlic crumbs in the wok.','Pile in the basket, prawns tails up (5 to a serve).'],
 'Fried garlic crumbs, green chilli rings, spring onion','Kasundi mayo in a dipping dish','Hot, straight from the fryer','Chonak goes in as fillet fingers, mushrooms as halves. Paper takes up the oil, so replace it for every order.')
add('wontonmore','Cabin starters','Wonton More','Fried wontons with sweet chilli: veg or chicken',['basket','dip'],'Paper-lined fry basket, dipping dish',
 'six crisp golden fried chicken wontons with pleated, blistered wrappers, stacked loosely in a black wire basket lined with kraft greaseproof paper, spring onion rings and sesame seeds on top, a small white ceramic dipping dish of glossy red-orange sweet chilli sauce beside the basket',
 ['Line the basket with a sheet of greaseproof paper, corners up.','Fry six wontons at 170 °C for about 3 minutes until blistered and golden.','Drain on a rack for 10 seconds.','Stack in the basket and scatter spring onion and sesame.'],
 'Spring onion rings, sesame seeds','Sweet chilli dip in a dipping dish','Hot, straight from the fryer','Chicken wontons go in the non-veg oil, veg wontons in the veg oil. Keep the sweet chilli dip warm at room temperature, never hot, so it stays sticky.')
add('crystal','Dim sum','Crystal Clear','Crystal veg dumplings, 4',['steamer6'],'6" bamboo steamer on a side plate',
 'a small bamboo steamer basket with lid off holding four translucent wheat-starch vegetable dumplings, carrots and green edamame visible through the skin, on a perforated parchment liner, set on a cream side plate, a small ceramic dish of soy-chilli dip beside it, soft steam',
 ['Wet the liner and lay it in the basket.','Place four dumplings with 1 cm between them.','Steam 6 minutes, lid on.','Carry out lidded, set the basket on a side plate.'],
 'None: the colour shows through the skin','Soy-chilli dip','Steaming hot','Lid comes off at the table. Skins tear if they touch, so keep the gaps.')
add('firestarters','Dim sum','Fire Starters','Chicken wontons in chilli oil',['soup'],'Soup bowl on a side plate',
 'a stoneware soup bowl on a cream side plate holding five silky poached chicken wontons sitting in a pool of deep red chilli oil with black vinegar, sesame seeds and spring onion rings on top, steam rising',
 ['Warm the bowl, spoon in 2 tbsp chilli oil and vinegar.','Slide in five poached wontons.','Spoon a little more oil over the top.','Finish with sesame and spring onion.'],
 'Toasted sesame, spring onion, a thread of black vinegar','Black vinegar in a dipping dish','Hot','The same wontons as Wonton Kenobi, so poach one batch for both. Oil goes in the bowl first so the skins do not stick.')
add('siumai','Dim sum','Siu Mai Goodness','Chouriço & chicken siu mai, 4',['steamer6'],'6" bamboo steamer on a side plate',
 'a small bamboo steamer basket with lid off holding four open-topped siu mai dumplings with orange chouriço flecks and a dot of red chilli oil on top, on a parchment liner, set on a cream side plate, steam rising',
 ['Wet the liner and lay it in the basket.','Place four siu mai, open tops up.','Steam 8 minutes.','Dot a little chilli oil on each top.'],
 'Chilli oil dot','Chilli oil in a dipping dish','Steaming hot','The chouriço will stain the wrapper orange; that is the look.')
add('prawndump','Dim sum','Prawn to Be Wild','Prawn & chive dumplings, 4',['steamer6'],'6" bamboo steamer on a side plate',
 'a small bamboo steamer basket with lid off holding four plump pleated translucent pink prawn and green chive dumplings on a parchment liner, set on a cream side plate, a small ceramic dish of chilli-soy dip beside it',
 ['Wet the liner and lay it in the basket.','Place four dumplings, pleats facing up.','Steam 6 minutes until the skin turns clear.','Serve with the chilli-soy on the side.'],
 'None: pink prawn and green chive show through','Chilli-soy dip','Steaming hot','Overcooked prawn goes rubbery fast, so time the steam exactly.')
add('baodown','Bao','Bao Down','Pork belly bao, 2',['bao'],'Long rectangular plate',
 'two steamed white bao buns folded around seared slices of glossy braised pork belly with hoisin, cucumber ribbons, peanut crumb and coriander, side by side on a long rectangular matte charcoal stoneware plate',
 ['Steam the buns 4 minutes and open them.','Smear hoisin inside each.','Lay 2 slices of seared belly and 3 cucumber ribbons in each.','Set the two buns side by side, tilted slightly to the same side.'],
 'Peanut crumb, coriander','Extra hoisin in a dipping dish','Hot','Sear the belly to order so the edges are crisp. Buns go on the plate seam-side up.')
add('feverpitch','Bao','Fever Pitch','Chilli chicken bao, 2',['bao'],'Long rectangular plate',
 'two steamed white bao buns stuffed with crisp glossy chilli chicken pieces, pickled red onion and a drizzle of chilli mayo, side by side on a long rectangular matte charcoal stoneware plate',
 ['Steam the buns 4 minutes and open them.','Fill each with Cabin Fever chicken.','Top with pickled onion.','Zig-zag the chilli mayo.'],
 'Pickled red onion, chilli mayo','None','Hot','Uses the Cabin Fever chicken straight from the wok, so fill to order.')
add('seoulmate','Bao','Seoul Mate','Gochujang paneer bao, 2',['bao'],'Long rectangular plate',
 'two steamed white bao buns filled with charred glossy red gochujang-glazed paneer cubes, cucumber slices and sesame seeds, side by side on a long rectangular matte charcoal stoneware plate',
 ['Steam the buns 4 minutes and open them.','Sear the paneer hard, then glaze it.','Fill each bun with paneer and cucumber.','Sprinkle sesame.'],
 'Toasted sesame, cucumber','None','Hot','Glaze the paneer in the pan, not in the bun, so the bun stays white.')
add('kpop','Seoul to Bangkok','K-Pop Wings','Korean fried wings, 6 pc',['basket'],'Paper-lined fry basket',
 'six glossy sticky-spicy Korean fried chicken wings with a glass-crisp crust, sesame seeds and spring onion, in a black wire basket lined with kraft greaseproof paper, a small empty white enamel bowl for bones beside it',
 ['Line the basket with greaseproof paper.','Fry twice, then brush the wings with sauce.','Pile six wings, tips up.','Place the empty bone bowl and a wet wipe beside it.'],
 'Sesame, spring onion','Bone bowl and a wet wipe','Hot','Sauce brushed on, not tossed: keeps the crust glass-crisp. Soy-garlic or gochujang on request.')
add('fryhard','Seoul to Bangkok','Fry Hard','Kimchi fries',['basket'],'Paper-lined fry basket',
 'crisp fries loaded with melted blistered cheese, chopped house kimchi, a zig-zag of gochujang mayo and spring onion rings, in a black wire basket lined with kraft greaseproof paper',
 ['Line the basket with greaseproof paper.','Fill with hot fries.','Top with cheese and torch it until it blisters.','Spoon the kimchi over the top and zig-zag the mayo.'],
 'Spring onion, sesame','Gochujang mayo already on top','Hot','Torch right before service. The basket is paper-lined, so keep the flame low and away from the paper.')
add('slaphappy','Seoul to Bangkok','Slap Happy','Raw papaya salad',['noodle'],'Wide shallow bowl',
 'a Thai raw green papaya salad in a wide shallow stoneware bowl: shredded green papaya, long beans, halved cherry tomatoes, crushed roasted peanuts, a lime wedge and red chilli slices, glossy with dressing',
 ['Pound the dressing and beans in the mortar.','Add the papaya and bruise lightly.','Pile high in the bowl, tomatoes on top.','Finish with peanuts.'],
 'Crushed peanuts, lime wedge, chilli slices','Lime wedge','Cold, made to order','Pound to order so it stays crunchy. Serve within 2 minutes.')
add('smashhit','Seoul to Bangkok','Smash Hit','Smashed cucumber salad',['dessert'],'Small shallow stoneware bowl',
 'Chinese smashed cucumber salad: rough smashed chunks of cucumber glistening with dressing, sliced garlic, a spoon of red chilli oil, toasted sesame seeds and coriander leaves, in a shallow charcoal stoneware bowl',
 ['Smash the cucumber with the flat of the knife and tear into chunks.','Salt for 5 minutes and pour off the water.','Toss with garlic, black vinegar and chilli oil.','Heap in a small bowl, sesame and coriander on top.'],
 'Toasted sesame, coriander','Chopsticks; extra chilli oil from the caddy','Cold, made to order','Salted cucumber is drained so the dressing clings. Make it to order: it turns watery after 10 minutes.')
add('noodlearound','Noodles & rice','Noodle Around','Hakka noodles: veg, chicken or mixed',['noodle'],'Wide shallow bowl, noodle tongs',
 'Hakka noodles tossed dry on high heat with chicken, prawn, egg strips, shredded cabbage, carrot and spring onion, heaped in a wide shallow sand-glazed stoneware bowl with spring onion greens on top, a pair of stainless noodle tongs beside it',
 ['Warm the bowl.','Lift the noodles from the wok with tongs and swirl into a nest.','Rest the protein on top.','Add the chilli vinegar on the side.'],
 'Spring onion greens','Chilli vinegar from the caddy','Hot from the wok','Mixed version adds egg, chicken and prawn. Noodles should be dry, not sauced.')
add('ricebaby','Noodles & rice','Rice Rice Baby','Fried rice: burnt garlic veg, chicken or mixed',['oval'],'Oval sharing platter',
 'burnt garlic vegetable fried rice with every grain separate, flecks of carrot and beans, golden fried garlic chips and spring onion on top, mounded on an oval cream speckled stoneware platter with a stainless serving spoon',
 ['Warm the platter.','Pack the rice into a ladle and tip it out as a dome.','Scatter garlic chips over the dome.','Lay the serving spoon alongside.'],
 'Burnt garlic chips, spring onion','Serving spoon','Hot from the wok','Day-old rice only. Garlic chips go on at the end so they stay crisp.')
add('holybasil','Noodles & rice','Holy Basil, Batman!','Thai basil chicken rice bowl',['cabinplate'],'Large deep plate',
 'Thai basil minced chicken stir-fry with holy basil leaves and red bird\'s-eye chillies beside a mound of jasmine rice on a large deep white enamel plate, a crisp-edged fried egg with a runny yolk on top',
 ['Warm the plate.','Mound the rice on one side.','Spoon the chicken beside it, basil leaves on top.','Lay the fried egg over the chicken.'],
 'Fresh holy basil, red chilli slices','Bird\'s-eye chillies in fish sauce, in a dipping dish','Hot','Fry the egg last and send it with the yolk runny.')
add('plainjane','Noodles & rice','Plain Jane','Steamed jasmine rice',['rice'],'Rice bowl',
 'a smooth domed mound of steamed jasmine rice in a small olive-glazed stoneware rice bowl, steam rising',
 ['Warm the bowl.','Press the rice into the bowl with a wet spoon.','Turn it out as a dome back into the bowl.'],
 'None','Serving spoon for the table','Steaming hot','The same bowl guests eat from, so there is nothing extra to wash.')
add('manchurian','Gravies & curries','Man, Churian!','Manchurian gravy, veg or chicken',['claypot'],'Small claypot on a rattan stand',
 'a brown glazed clay pot with the lid off on a rattan stand, filled with dark glossy ginger-garlic-soy Manchurian gravy and crisp fried vegetable balls with spring onion greens on top, steam rising',
 ['Heat the claypot with the lid on.','Add the fried veg balls (or chicken) to the simmering gravy for 30 seconds.','Pour into the pot to 2 cm from the rim.','Sprinkle spring onion and carry out with the lid beside.'],
 'Spring onion greens','Serve with Rice Rice Baby or jasmine rice','Bubbling hot','Fry the balls just before you sauce them. They soften in minutes.')
add('greencurry','Gravies & curries','Green With Envy','Thai green curry: veg, chicken or prawn',['claypot','rice'],'Small claypot on a stand, jasmine rice bowl',
 'a brown glazed clay pot with the lid off on a rattan stand filled with pale green Thai green curry with aubergine, long beans, red chilli slices, torn lime leaf and Thai basil leaves, a small olive-glazed stoneware bowl of jasmine rice beside it',
 ['Heat the claypot.','Add the curry and the protein, simmer 2 minutes.','Pour into the pot, then float basil and lime leaf.','Serve with a bowl of Plain Jane beside it.'],
 'Thai basil, torn lime leaf, red chilli slice','Plain Jane jasmine rice','Bubbling hot','Pour a thin line of coconut cream on top just before it leaves the pass.')
add('khaosuey','Gravies & curries','Suey Generis','Khao suey, veg or chicken',['noodle','toptray'],'Wide shallow bowl + divided topping tray',
 'Burmese khao suey: golden coconut curry with egg noodles in a wide shallow stoneware bowl, beside a round divided stoneware tray with five small compartments of crispy fried noodles, sliced shallots, fried garlic, lime wedges and red chilli flakes',
 ['Warm the bowl.','Put the egg noodles in, then the curry over them.','Fill the five compartments of the tray.','Place the tray beside the bowl, not on top.'],
 'Crispy noodles, shallots, fried garlic, lime, chilli flakes in the tray','Divided topping tray','Hot','Guests build it themselves. Crispy noodles stay in the tray until they take them, so they never go soggy.')
add('darsaan','Sweet','Honey, I Shrunk the Noodles','Darsaan with ice cream',['dessert'],'Dessert bowl, dessert spoon',
 'darsaan dessert: crisp fried flat noodles tossed in glossy hot honey with sesame seeds, piled in a shallow dark charcoal stoneware bowl beside a scoop of vanilla ice cream, a stainless dessert spoon',
 ['Warm the bowl slightly.','Toss the crisp noodles in hot honey.','Pile into the bowl.','Add one scoop of ice cream at the edge and sprinkle sesame.'],
 'Toasted sesame','None','Noodles warm, ice cream cold','Honey must be hot when it meets the noodles. Scoop the ice cream last.')
add('sticky','Sweet','Sticky Situation','Coconut sticky rice with ice cream',['dessert'],'Dessert bowl, dessert spoon',
 'coconut sticky rice dessert: warm sticky rice in a shallow dark charcoal stoneware bowl with coconut cream poured over, palm jaggery syrup, toasted sesame and one scoop of vanilla ice cream, a stainless dessert spoon',
 ['Warm the bowl slightly.','Mound the sticky rice and pour over the warm salted coconut.','Drizzle palm jaggery.','Add one scoop of ice cream and sprinkle sesame.'],
 'Toasted sesame','None','Rice warm, ice cream cold','Pour the coconut at the table edge so it stays glossy.')
add('scoop','Sweet','Scoop There It Is','Ice cream: 2 scoops, 1 topping',['dessert'],'Small shallow stoneware bowl, dessert spoon',
 'two scoops of ice cream, one vanilla and one pale tender coconut, in a shallow dark charcoal stoneware bowl, warm palm jaggery syrup drizzled over them, a spoonful of toasted sesame and crushed peanut crunch on top, a stainless dessert spoon',
 ['Chill the bowl in the freezer.','Scoop two flavours with a warm scoop.','Add the guest\'s topping: warm palm jaggery, sesame-peanut crunch or chocolate sauce.','Serve with a dessert spoon.'],
 'The chosen topping','None','Ice cream cold, jaggery syrup warm','Three flavours: vanilla, tender coconut, kokum. Dip the scoop in the warm well between scoops. Never refreeze melted ice cream.')
add('steamer2','For the table','Steamer for two','2 baskets of dim sum + 2 bao',['board','steamer8','bao'],'Serving board, 8" two-tier steamer, long plate',
 'a wooden serving board carrying a two-tier bamboo steamer with the lid lifted to show dumplings, beside a long rectangular charcoal plate with two bao buns and two small ceramic dipping dishes',
 ['Steam the dim sum and bao separately.','Stack the two baskets on the board.','Put the bao plate beside them.','Add two dipping dishes.'],
 'None','Two dipping dishes','Steaming hot','Carry out as one board so the table sees the whole spread. Chef picks the dim sum of the day.')
add('feast','For the table','Cabin feast for four','4 soups + five shared dishes',['susan','soup'],'Lazy susan, four soup bowls on side plates',
 'a top-down view of a table with a round wooden lazy susan carrying shared dishes: a plate of dry chilli chicken, a basket of salt and pepper prawns, a bowl of Hakka noodles and a claypot of green curry with a bowl of rice; four soup bowls on side plates around the edge',
 ['Serve the four soups first, each on a side plate.','Clear the soups, then bring the shared dishes together.','Place them on the lazy susan, heaviest at the edge.','Dessert follows as one darsaan with four spoons.'],
 'As per each dish','Four rice bowls and serving spoons','Everything hot','Five dishes for four people only fit if the table turns. Send all five together so nothing sits.')
add('bowlgame','For the table','Bowl game (lunch)','Noodles or rice with Cabin Fever, or a curry with rice',['cabinplate'],'Large deep plate',
 'a lunch plate on a large deep white enamel plate: Hakka noodles on one side and dry chilli chicken on the other, spring onion greens on top, a small ceramic dish of chilli vinegar beside it',
 ['Warm the plate.','Put the noodles (or rice) on one half.','Put the Cabin Fever chicken on the other half.','Spoon the chilli vinegar into the dipping dish.'],
 'Spring onion greens','Chilli vinegar','Hot from the wok','Noon to 4 pm. One plate keeps the lunch rush fast.')

# ---------------------------------------------------------------- DRINKS
D = []
def dadd(id, sec, name, sub, refs, glass, prompt, build, garnish, temp, note, gen=True):
    D.append(dict(id=id, sec=sec, name=name, sub=sub, refs=refs, vessel=glass, prompt=prompt, build=build, garnish=garnish, side='', temp=temp, note=note, gen=gen))
dadd('crisp','Beer','Comrade Crisp','People\'s Lager, on tap',['pint'],'Pint glass',
 'a 500 ml pint glass of pale golden rice lager with a two-finger white foam head and cold condensation',
 ['Use a chilled, clean glass.','Pour at 45 degrees, then straighten.','Leave a 2 cm head.'],'None','3 °C','Wash glasses in a no-oil rack: grease kills the head.')
dadd('gose','Beer','Gose Bumps','Kokum gose, on tap',['beer330'],'330 ml beer glass',
 'a 330 ml straight-sided glass of hazy pink-coral kokum gose with a thin white foam, condensation on the glass',
 ['Chilled glass.','Pour gently to keep the haze.','Wipe the rim.'],'None','4 °C','330 ml shows off the pink colour.')
dadd('kings','Beer','Kings','Premium pilsner, bottle',['pint'],'Bottle plus pint glass',
 'a green-glass beer bottle with a plain label standing next to a pint glass half filled with pale golden pilsner and white foam, on a wooden table',
 ['Chill the bottle to 3 °C.','Open at the table.','Serve with a clean pint glass.'],'None','3 °C','Garden tables get the bottle in a small ice bucket.')
dadd('pitcher','Beer','Pitcher','1.5 L of Comrade Crisp or a craft tap',['pitcher','beer330'],'Pitcher with 330 ml glasses',
 'a clear glass pitcher of golden lager with foam beside two 330 ml beer glasses on a wooden table',
 ['Pour into a chilled pitcher.','Bring two or more 330 glasses.','Top up at the table.'],'None','3 °C','Garden tables order these: bring extra coasters.')
dadd('paddle','Beer','Tasting paddle','3 × 150 ml, all three taps',['paddle3'],'Wooden paddle, 150 ml taster glasses',
 'a wooden beer tasting paddle holding three 150 ml taster glasses of pale lager, pink gose and amber ale',
 ['Fill each taster to 1 cm below the rim.','Order: lightest to darkest, left to right.','Hand over the paddle with a note of the order.'],'None','3 °C','Same paddle as the checklist, so no new image.', gen=False)
dadd('neat','Whisky','Single malts, neat','Paul John, Amrut, Glenlivet, Talisker',['nosing'],'Nosing glass, water dropper',
 'a Glencairn-style whisky nosing glass with a 30 ml pour of amber single malt on a dark wood table, a small glass water dropper and a small glass of water beside it',
 ['Pour 30 ml.','Set it with the water dropper beside it.','Offer water on the side.'],'None','Room temperature','A tulip glass holds the nose.')
dadd('rocks','Whisky','Whisky on the rocks','Any whisky',['rocks'],'Rocks glass',
 'a heavy-based rocks glass with 60 ml of amber whisky over one large clear ice cube on a dark wood table',
 ['Chill the glass.','Add the large cube.','Pour 60 ml over it.'],'None','Cold','A big cube melts slowly.')
dadd('toki','Whisky','Suntory Toki highball','Japanese blended whisky',['highball'],'Highball glass',
 'a tall highball glass of Japanese whisky highball with clear ice and sparkling soda and a curled lemon twist on a dark wood table',
 ['Fill the glass with ice.','Add 30 ml whisky and top with soda.','Stir once and twist a lemon peel over it.'],'Lemon twist','Ice cold','Lots of ice keeps it fizzy.')
dadd('vodka','Vodka','Vodka shots','Haku, Belvedere, house infusions',['shot'],'Chilled shot glass',
 'two frosted heavy-based shot glasses of clear vodka, one with a red chilli and a garlic clove visible inside, on a dark wood table',
 ['Keep glasses in the freezer.','Pour 30 ml.','Serve with the chilli chicken.'],'Chilli and garlic in the house infusion','-5 °C','Pour the infusion straight from its bottle.')
dadd('kokumsour','Cocktails','Kokum feni sour','Cashew feni, kokum, lime, aquafaba',['coupe'],'Coupe glass',
 'a stemmed coupe glass of a pink-magenta kokum sour cocktail topped with a thick white aquafaba foam and a few drops of bitters on the foam, on a dark wood table',
 ['Dry shake, then shake hard with ice.','Double-strain into a chilled coupe.','Dot bitters on the foam.'],'Bitters dots','Ice cold, served up','Silky foam shows best in a coupe.')
dadd('coconuthigh','Cocktails','Coconut feni highball','Coconut feni, lemongrass syrup, soda',['highball'],'Highball glass',
 'a tall highball glass of a clear coconut feni highball with ice, soda bubbles and a lemongrass stalk, on a dark wood table',
 ['Fill with ice.','Add feni and lemongrass syrup.','Top with soda and stir.'],'Lemongrass stalk','Ice cold','Our long, easy drink.')
dadd('lychee','Cocktails','Lychee & lemongrass martini','Vodka, lychee, lemongrass, lime',['coupe'],'Coupe glass',
 'a stemmed coupe glass of a pale pink lychee martini with a whole lychee on a cocktail pick resting across the rim, on a dark wood table',
 ['Shake with ice.','Double-strain into a chilled coupe.','Rest a lychee on a pick across the rim.'],'Lychee on a pick','Ice cold, served up','Double-strained so there are no ice chips.')
dadd('margarita','Cocktails','Tamarind chilli margarita','Agave spirit, tamarind, lime, chilli-salt rim',['rocks'],'Rocks glass with chilli-salt rim',
 'a rocks glass with a red chilli-salt rim holding a brown-amber tamarind margarita over one large clear ice cube with a lime wheel, on a dark wood table',
 ['Rim half the glass with chilli salt.','Shake and strain over a large cube.','Add a lime wheel.'],'Lime wheel','Ice cold','Rim only half the glass so guests can choose.')
dadd('sichuan','Cocktails','Sichuan G&T','Gin, tonic, Sichuan pepper, grapefruit',['highball'],'Highball glass',
 'a tall highball glass of a clear gin and tonic with ice, a grapefruit slice and a few Sichuan peppercorns, on a dark wood table',
 ['Fill with ice.','Add gin and a slice of grapefruit.','Top with tonic and drop in the peppercorns.'],'Grapefruit slice, Sichuan pepper','Ice cold','The pepper gives a gentle tingle.')
dadd('kimchimary','Cocktails','Kimchi Mary','Vodka, tomato, kimchi brine, gochugaru rim',['highball'],'Highball glass with gochugaru rim',
 'a tall highball glass of a red Bloody Mary cocktail with a red gochugaru rim, ice, and a skewer with a folded kimchi leaf and a cherry tomato, on a dark wood table',
 ['Rim the glass with gochugaru.','Roll the drink between tins to keep it smooth.','Pour over ice, add the skewer.'],'Kimchi and tomato skewer','Ice cold','Roll, never shake: shaking makes it foamy.')
dadd('soju','Cocktails','Soju Yakult','Soju, Yakult, lime',['rocks'],'Rocks glass',
 'a short rocks glass of a milky white-pink Soju Yakult cocktail over ice with a lime wheel, on a dark wood table',
 ['Fill the glass with ice.','Shake soju, Yakult and lime and strain.','Add a lime wheel.'],'Lime wheel','Ice cold','The Seoul bar classic.')
dadd('somaek','Cocktails','Somaek','Soju and lager',['beer330','shot'],'330 ml glass plus shot glass',
 'a 330 ml beer glass of pale golden lager with foam beside a frosted shot glass of soju, on a dark wood table',
 ['Pour the lager into a chilled glass.','Fill a shot glass with soju.','Drop it in at the table.'],'None','Ice cold','The shot goes in the beer at the table.')
dadd('limesoda','Zero proof','Fresh lime soda','Sweet or salted',['highball'],'Highball glass',
 'a tall highball glass of fresh lime soda with ice, a lime wedge on the rim and a bamboo straw, on a dark wood table',
 ['Press the lime to order.','Add sugar syrup or salt.','Top with soda over ice.'],'Lime wedge, bamboo straw','Ice cold','Pressed to order: the cabin-table standard.')
dadd('kokumsoda','Zero proof','Kokum soda','Kokum, black salt, soda',['highball'],'Highball glass',
 'a tall highball glass of pink kokum soda with ice, a pinch of black salt on top and a bamboo straw, on a dark wood table',
 ['Add kokum syrup and black salt.','Top with soda over ice.','Stir once.'],'Pinch of black salt, bamboo straw','Ice cold','Salty-sour and pink.')
dadd('icedtea','Zero proof','Lemongrass-ginger iced tea','Black tea, lemongrass, ginger',['highball'],'Highball glass',
 'a tall highball glass of amber iced tea with ice, a lemongrass stalk and a thin ginger slice, on a dark wood table',
 ['Fill with ice.','Pour the chilled tea.','Add the lemongrass and ginger.'],'Lemongrass stalk, ginger slice','Ice cold','Brewed in house and chilled.')
dadd('irish','Hot coffee','Irish coffee','Jameson, brown sugar, cream',['irish'],'Irish coffee glass',
 'a stemmed Irish coffee glass with a handle holding dark coffee capped by a thick layer of lightly whipped white cream on a dark wood table',
 ['Warm the glass with hot water.','Stir coffee, Jameson and brown sugar.','Float lightly whipped cream over the back of a spoon.'],'Cream cap','Hot','The layers need clear glass.')
dadd('coffee','Hot coffee','Brewed coffee','Black or with milk',['cup','milk'],'Cup and saucer, milk jug and sugar pot',
 'a sand-glazed stoneware coffee cup and saucer of black coffee beside a small white milk jug and a lidded sugar pot on a dark wood table',
 ['Warm the cup.','Pour the filter coffee.','Bring milk and sugar on the side.'],'None','Hot','Teaspoon on the saucer.')

# ---- drinks that had no photo of their own (images made by src/gen-variants.sh from src/plating-variant-jobs.py)
dadd('gimme','Beer','Gimme Gimme Gimme','Guest tap, rotating',['pint'],'Pint glass',
 'a 500 ml pint glass of hazy amber-orange craft IPA with a thick white foam head',
 ['Rinse the pint cold.','Pour at 45 degrees, straighten for the head.','Wipe the base.'],'None','Cold, 4–6 °C','Whatever is on the guest tap: ask the brewer for the pour and the abv. Rotates every couple of weeks.',gen=False)
dadd('budweiser','Beer','Budweiser','American lager, bottle',['pint'],'Bottle with a pint glass',
 'a chilled lager bottle beside a pint glass of pale golden lager','Open at the table or pour at the bar.'.split('|'),'None','Ice cold, 2–4 °C','330 ml or 650 ml. Serve from the coldest fridge, with the pint glass on the side.',gen=False)
dadd('maltflight','Whisky','Single malt flight','Paul John, Glenlivet 12, Talisker 10',['flight','nosing'],'Flight board with nosing glasses',
 'a wooden flight board with three nosing glasses of whisky',
 ['Pour 20 ml of each into a nosing glass.','Set them in order, lightest to peatiest, left to right.','Add a small glass of water and the dish of chilli peanuts.'],'Chilli peanuts, water','Room temperature','Hand over the tasting notes card with the board.',gen=False)
dadd('water','Zero proof','Water','Still 1 L, sparkling 330 ml',['water'],'Water bottle and tumbler',
 'a bottle of still water and a tumbler','Pour at the table.'.split('|'),'Lemon slice on request','Chilled','Always offered with the first order; bring an extra tumbler for the table.',gen=False)
dadd('softdrinks','Zero proof','Soft drinks','Coke, Diet Coke, Thums Up, Sprite',['highball'],'Highball glass',
 'a tall glass of cola with ice and lime beside a bottle and a can','Fill the glass with ice.|Pour the soft drink down the side.|Add a lime wedge.'.split('|'),'Lime wedge','Ice cold','Open at the table so the fizz is part of the service.',gen=False)
dadd('tonic','Zero proof','Tonic or ginger ale','Over ice with lime',['highball'],'Highball glass',
 'a tall highball of tonic over ice with lime','Fill with ice.|Pour tonic or ginger ale.|Add a lime wheel.'.split('|'),'Lime wheel','Ice cold','The same mixers we use in the cocktails, on their own.',gen=False)

# ---- veg / non-veg options: one plating photo per option the menu offers.
# (key, label, mark v|nv, image id). The first photo already existed under the dish id; the others were added with gen-variants.sh.
VARS = {
 'hotsour':[('veg','Veg','v','hotsour'),('chicken','Chicken','nv','hotsour-chicken')],
 'tomkha':[('veg','Veg','v','tomkha'),('chicken','Chicken','nv','tomkha-chicken')],
 'cabinfever':[('paneer','Paneer','v','cabinfever-paneer'),('chicken','Chicken','nv','cabinfever'),('pork','Pork','nv','cabinfever-pork')],
 'honeytrap':[('potato','Potato','v','honeytrap'),('chicken','Chicken','nv','honeytrap-chicken')],
 'saltpepa':[('mushroom','Mushroom','v','saltpepa-mushroom'),('chonak','Chonak','nv','saltpepa-chonak'),('prawns','Prawns','nv','saltpepa')],
 'wontonmore':[('veg','Veg','v','wontonmore-veg'),('chicken','Chicken','nv','wontonmore')],
 'noodlearound':[('veg','Veg','v','noodlearound-veg'),('chicken','Chicken','nv','noodlearound-chicken'),('mixed','Mixed','nv','noodlearound')],
 'ricebaby':[('veg','Burnt garlic veg','v','ricebaby'),('chicken','Chicken','nv','ricebaby-chicken'),('mixed','Mixed','nv','ricebaby-mixed')],
 'manchurian':[('veg','Veg','v','manchurian'),('chicken','Chicken','nv','manchurian-chicken')],
 'greencurry':[('veg','Veg','v','greencurry'),('chicken','Chicken','nv','greencurry-chicken'),('prawn','Prawn','nv','greencurry-prawn')],
 'khaosuey':[('veg','Veg','v','khaosuey-veg'),('chicken','Chicken','nv','khaosuey-chicken')],
}
for x in F + D:
    v = VARS.get(x['id'])
    if v: x['vars'] = [dict(k=k, label=l, mk=m, img=i) for k, l, m, i in v]

ALL = F + D
if __name__ == '__main__':
    import sys
    json.dump(ALL, open('data.json','w'), indent=1, ensure_ascii=False)
    print(len(F), 'food', len(D), 'drinks', sum(1 for x in ALL if x['gen']), 'to generate')
