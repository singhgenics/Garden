# Cabin East menu

The one menu, for the table and the phone. `index.html` is self-contained (images, fonts and logo embedded) and `picture-menu.pdf` is the same page printed as two A3 sheets: food on the front, drinks and dessert on the back. Live at https://singhgenics.github.io/Garden/menu/

- 8 photos; every other dish is a text line with its veg mark, description, price at the end, spice dots and a "Contains" allergen line.
- Edit dishes and prices in `build.py`, run `python3 build.py`, then re-export the PDF with headless Chrome (command at the top of `build.py`). Check that the food sheet and the drinks sheet are each still one A3 page.
- Prices carry no rupee sign. The allergen lines come from ingredient lists and must be confirmed by the chef.
- `MENU-ENGINEERING.md` explains the layout choices; `expert-notes-menu-engineering.md` has the notes from the Menu Engineering notebook.
- Photos in `img/` are AI-generated visual targets and show the style of each dish.
