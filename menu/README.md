# Cabin East picture menu

The only menu in this repo: a photo-led food and drinks menu, one self-contained `index.html` (images, fonts and logo embedded) plus `picture-menu.pdf` (5 poster pages). Live at https://singhgenics.github.io/Garden/menu/

- Edit dishes and prices in `build.py`, then run `python3 build.py` (images are in `img/`). Prices carry no rupee sign.
- `MENU-ENGINEERING.md` explains the layout choices and the assumed star/puzzle/plowhorse/dog classes.
- Re-export the PDF with headless Chrome: `chrome --headless=new --no-pdf-header-footer --print-to-pdf=picture-menu.pdf file://$PWD/index.html`
- The earlier menu, crockery, plating, board and source files were removed on 2026-11-03; they are in the git history of this repo (commit f19b48d and before).
