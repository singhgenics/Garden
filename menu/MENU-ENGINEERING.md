# Menu engineering notes (from the NotebookLM notebook "Menu Engineering", read 2026-11-14)

Two menus, because the notebook treats printed and digital differently:
- `dine-in.html` / `dine-in-menu.pdf`: the printed menu. Built by `build_print.py`. Text-led, one photo per page.
- `index.html` / `picture-menu.pdf`: the photo-forward menu for QR, website and phone. Built by `build.py`.

## Rules from the notebook and where they are applied
| Rule | Applied |
|---|---|
| No currency symbol, no decimals | Both menus |
| Nest the price at the end of the description, same type; no price column; no dotted leaders | Both menus |
| Descriptions 12 to 18 words, sensory, provenance (housemade, Konkan, Goan) | Dine-in menu, every item |
| 5 to 7 items per section (entrees 8, beverages 8, desserts 4 to 6) | Dim sum and bao 7, wok 6, soups and salads 5, mains 6, beer 9, cocktails 8, whisky and vodka 8, desserts 3 plus 2 after-dinner |
| Golden triangle (centre, top right, top left) and Z-read | Photo top left, bestseller box centre, mains (stars) top right |
| Primacy and recency: best items first two and last, plowhorses in the middle | Each section ordered that way, see below |
| Ascending price within a section (Indian casual dining), expensive items at the bottom | Sections run cheapest to dearest except where margin order wins |
| Callouts: one item per page, 1 to 2 per section | Dine-in: 2 per food page (one photo, one box), 2 per drinks page, 1 on the dessert card |
| Photos: avoid heavy photography on dine-in menus; one standout per page; digital menus photo-forward | Dine-in: one photo per page. Digital: full photo menu |
| Decoys next to stars | Prawn to Be Wild 340 beside Siu Mai Goodness (last in dim sum); Tamarind chilli margarita 460 beside Kokum feni sour (last in cocktails) |
| Happy hour: show the regular price next to the happy price | "Kings 330 ml 99 (120), Budweiser 330 ml 149 (180)" with the regular price struck through |
| Two-panel menu; separate dessert menu brought after the meal | Food front, drinks back, dessert and coffee on their own card |
| Daily specials 1 to 3 | "Today's special" slot on the food page |
| Vegetarian first (where 45% or more guests are vegetarian) | Not applied: the notebook says Goa and the south and east skew non-vegetarian, so dim sum leads; veg marks on every dish |

## Classes (assumed, not measured)
Stars (high margin, popular): Crystal Clear, Siu Mai, Fire Starters, Konso Fever, Honey Trap, K-Pop Wings, Noodle Around, Rice Rice Baby, Comrade Crisp, Gose Bumps. Puzzles (high margin, push): Seoul Mate, Fry Hard, Smash Hit, Slap Happy, darsaan, Sticky Situation, Kokum feni sour. Plowhorses (popular, thin margin, kept mid-list): prawn and chonak dishes, Kings, Budweiser. No dogs flagged yet.

The notebook defines contribution margin as price minus food cost and compares each dish with the average margin and the average units sold, over 30 to 90 days of POS data. Re-run it after the first 4 to 8 weeks of sales and reorder; re-engineer whenever a food cost moves more than 5%.

## Changes against the old menu
- Happy hour is Kings and Budweiser bottles only (the bar starts bottles-only, no taps; the 149 Budweiser price is a placeholder to confirm); the old food deals (Crystal Clear 179, Konso Fever chicken 249) are dropped because they discount the best earners.
- Irish coffee and brewed coffee moved to the dessert card. Water, soft drinks and tonic are on the drinks page.
- Whisky list trimmed to 8 lines; Black Label, William Lawson's, Monkey Shoulder, Haku and Belvedere are not on the page.

## Update 2026-11-14 (photo menu republished)
The photo menu now carries the fixes from the expert review: scroll offset under the sticky bar, prices at the end of each description (pills for Konso Fever, no columns or leaders), variants listed once, cards sized by margin, 9 callout tags, 12 to 18 word descriptions, sections of 5 to 8, anchors at the top of sections, happy hour on taps and Kings with the regular price struck through, water and soft drinks restored, a veg / non-veg filter, dessert and coffee behind a button, spice dots and a "Contains" line per dish, and the top bar no longer clips its first link on a phone.
Open items: the "Contains" lines come from ingredient lists, so the chef must confirm them; beer sizes are still pint, 330 ml and 500 ml; the phone page is about 17,000 px long.
Print: the PDF pages are 1200 x 2250 px.

## Update 2026-11-14 (middle ground, published)
The picture menu is also the dine-in menu, so the notebook's advice on printed menus was applied by cutting the photos from 28 to 8 (Crystal Clear, Siu Mai Goodness, Bao Down, Konso Fever, Noodle Around, Gose Bumps, Kokum Feni Sour, Honey I Shrunk the Noodles) and showing every other dish as a text line. The printed menu is two A3 sheets (food front, drinks and dessert back), each scaled so the three columns fill the page with no blank band; headings always stay with their first item. The screen page is about 10,600 px long on a phone. `fit_pages.py` and `pageheights.json` were retired with the old variable-height pages.


**2026-11-15:** the beer section is bottles only (value, premium and craft) with a bucket of five; Man, Churian! was replaced by two fried-rice gravies, Gravy Train (chilli-garlic) and Sweet Talk (sweet chilli). All beer prices except Kings and Budweiser are placeholders until the supplier prices and the Goa excise MRPs are confirmed.

## Update 2026-11-18 (prices easy to read)
Prices were buried in the description at small size. Now every price is bold, burgundy (gold on dark panels) and set in the mono face: a single price sits at the end of the description (same line, no column, no dotted leader, no currency symbol), and dishes with options (Veg / Chicken / Mixed, 330 ml / 650 ml, 30 / 60 ml) get their own line, label then bold number. Happy hour shows the happy price large with the regular price struck through. Both A3 sheets re-checked: each is one page. Website menu.html (menu-sync.py) follows the same rule; the right-hand price column was removed. Dishes, order and prices are unchanged, so the table menu, POS and crockery lists need no edit.
