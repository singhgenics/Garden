# Konso menu

The one menu, for the table and the phone. `index.html` is self-contained (images, fonts and logo embedded) and `picture-menu.pdf` is the same page printed as two A3 sheets: food on the front, drinks and dessert on the back. Live at https://singhgenics.github.io/Garden/menu/

- 8 photos; every other dish is a text line with its veg mark, description, price at the end, spice dots and a "Contains" allergen line.
- Edit dishes and prices in `build.py`, run `python3 build.py`, then re-export the PDF with headless Chrome (command at the top of `build.py`). Check that the food sheet and the drinks sheet are each still one A3 page.
- Prices carry no rupee sign. The allergen lines come from ingredient lists and must be confirmed by the chef.
- `MENU-ENGINEERING.md` explains the layout choices; `expert-notes-menu-engineering.md` has the notes from the Menu Engineering notebook.
- Photos in `img/` are AI-generated visual targets and show the style of each dish.

## Poster menu (A3, four faces)

`poster/index.html` and `poster/poster-menu.pdf` (live at https://singhgenics.github.io/Garden/menu/poster/) are a poster-style version of the same menu: big logo, realistic cut-out photo on a gold sun disc, brush-stroke section tags, ruled item rows and a framed strip at the bottom. Four A3 faces: drinks first (beer and cocktails; vodka, whisky, wine and zero proof last), then food (dim sum to mains, sweets last).

- `poster.py` builds it from the dish data in `build.py` (so edit dishes and prices there), then export the PDF with headless Chrome (command at the top of `poster.py`). Check that each face still fits one A3 page with nothing clipped behind the bottom strip.
- Photos in `cut/` are realistic dish photos generated in Google Flow (project "Konso menu posters") on a flat cyan background and cut out by `cutout.sh`; `zero.jpg` and `whisky.jpg` are glassware shot on cream paper colour instead, because a cut-out leaves holes in glass.
- Note: `build.py` now also carries a restyled version of the screen menu; `index.html` and `picture-menu.pdf` here are still the earlier published version until `build.py` is re-run and republished.
- Customer clarity: on a phone (screen under 700 px wide) the poster page sends people to the easy phone menu at `../`; add `?poster` to the address to stay. A bar at the top of the poster page links to Drinks, Food and the phone menu. Every face carries a one-line legend (veg / non-veg, spice dots, prices in rupees and taxes extra, allergy note, drink-responsibly note).
