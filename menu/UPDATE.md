# Updating everything when the menu changes

Standing rule from the owner: **any change to the menu or its items updates everything**: the crockery checklist, the plating cards and this site.

The menu source of truth is `food.html` and `drinks.html` in the Dream repo (`~/Documents/Code/Dream`). A Claude Code hook in that project runs `src/check-menu.mjs` after edits and raises a reminder when the menu data no longer matches `src/menu.hash` (the hash of the menu this site was last built from).

## Checklist

1. **See what changed.** `git -C ~/Documents/Code/Dream diff` (or compare dish names). List new, renamed, removed and re-priced items.
2. **Crockery.** Edit the arrays in `src/crockery-source.html`:
   - `ITEMS`: add, remove or re-quantify vessels (id, group, photo id, name, spec, use, qty, unit).
   - `FOOD` / `DRINKS`: the dish-to-vessel map, one row per menu line (`[name, sub, vesselId, alongside, why]`). Every menu line needs a row.
   - If a new vessel is needed, generate its image (see Images).
3. **Plating.** Edit `src/plating_data.py`: one entry per food item or drink (`add(...)` / `dadd(...)`), with the image prompt, build steps, garnish, side, serving temperature and note. Remove entries for dropped items.
4. **Images** (free, via Google Flow; never use a paid generator without asking first):
   - Sign in is saved as the `brandcanvastc` gflow profile (`gflow auth status`). Flow project id `5657dbf4-d0a4-414b-9fda-48d501728c40`.
   - Crockery photos: `gflow image t2i "<prompt>" --model nano2 --aspect 4:3 -n 1 --project <id> -o <file>.png`, then resize to 800x600 JPEG into `img/crockery/<photoId>.jpg`. Style: catalogue studio shot on plain warm sand-beige paper, soft daylight from the left, no text.
   - Plating photos: `gflow image i2i "<prompt>" --ref img/crockery/<vessel>.jpg ... -o <file>.png`, resize to 900x675 JPEG into `img/plating/<id>.jpg`. See `src/plating-image-jobs.tsv` for the prompt style (warm oak table for food, dark bar top for drinks).
   - Regenerate an image only when the dish or vessel changed.
   - **Veg / non-veg options:** every option the menu offers has its own plating photo. `VARS` in `src/plating_data.py` lists the options per dish (label, veg/non-veg mark, image id); the plating cards show them as tabs and the photo menus as one photo per option. To add an option or a photo-less item, add its prompt to `src/plating-variant-jobs.py` and run `src/gen-variants.sh <id>` (free Flow images, same project, writes `img/plating/<id>.jpg`; it skips ids that exist, so delete a file to redo it).
5. **Rebuild the site.** `node src/build.mjs` (writes `index.html`, reports missing images). Check it in a browser at desktop and phone width.
6. **Crockery checklist.** It lives only on the Menu site now (the Crockery tab, built from `src/crockery-source.html`). The separate claude.ai checklist artifact was deleted on 2026-10-20 at the owner's request; do not recreate it.
7. **Photo menus.** Deleted on 2026-10-22 at the owner's request (`food-menu.html`, `drinks-menu.html` and their PDFs). Do not rebuild them. `src/build-menus.py` and `src/menus.css` are kept only in case they are wanted again.
8. **Push.** Commit and push this repo to `main`; GitHub Pages rebuilds at https://singhgenics.github.io/Menu/ . Verify the live page loads with no broken images.
8a. **Brand.** The pages carry the Cabin East logo (roof, wok and steam lockup) and the three WOK / STEAM / DRAUGHT planks. To re-apply it to the Dream menu pages and to `src/template.html` and `src/brand-snippets.json` here, run `python3 ~/Documents/Code/Dream/CabinEast/src/apply_logo.py` (idempotent; never touches menu data), then rebuild this site (steps 5 and 7). The printed A2 boards (`menu-food.pdf`, `menu-drinks.pdf`, `menu-board.pdf` in the Dream repo) are rebuilt from the live menu by `~/Documents/Code/Dream/CabinEast/src/render_boards.sh` (cream paper, ink section tabs, new logo); run it after any menu change and commit the three PDFs.
8b. **Table setting page.** `table-setting.html` (nav tab "Table") is built by `python3 src/build-tableset.py` from `src/table-setting-source.html` (same source as the claude.ai artifact https://claude.ai/artifact/9RfkR21Rdp1kjM5JNXbgGX; its `g/` folder = crockery photos + `t-<id>.jpg`). Real table sizes come from the Simplex floor plan (tables for 4 are 1.2 × 0.65 m, tables for 2 are 0.6 × 0.6 m). Room photos: `src/gen-tableset.sh` (free Flow, 2-3 reference photos max per image; more fail), written to `img/tableset/`. If a crockery piece or the table plan changes, edit the source and rebuild.
9. **Record it.** `node src/check-menu.mjs --update` so the hook goes quiet.
10. Tell the owner what changed on each surface.

## Furnishings (the fourth view)

The furnishings schedule follows the **Simplex room** (`~/Documents/Code/Dream/Simplex`: 4.9 × 8.8 m, 18 covers inside + 8 in the garden), not the menu. When the Simplex layout or the 3D model changes (tables, bar, lights, AC), update it:

1. Edit `src/furnishings_data.py`: one tuple per line in each `grp(...)` (code, name, size, material, qty, unit, low and high unit price in INR, phase 1 or 2, where, note, image id). Prices are planning ranges, not quotes. Codes (S1, T1, B1, L1, C1, ...) are what the two plans use.
2. Edit `src/furnishing_plans.py` if a piece moves: it draws `img/furnishings/furniture-plan.svg` and `ceiling-plan.svg` from the same x/z coordinates as the Simplex model (x from the right wall -2.45 to the left wall +2.45, z from the shopfront 0 to the back wall 8.8) and prints the fan clearance checks.
3. Images (free, Google Flow, same project as the rest): prompts are in `src/furnishing-jobs.py`; run `src/gen-furnishings.sh [id...]` (runs one at a time, because the gflow profile allows one process; it skips ids that exist, so delete a `img/furnishings/<id>.jpg` to redo it). Room shots use screenshots of the Simplex 3D model in `src/furnishing-refs/` as the layout reference.
3a. The **Gallery** section lists every image by section from `GALLERY` in `src/furnishings_data.py` (id, caption); add a new image there and it appears, with the enlarge view.
4. `node src/build.mjs` regenerates `furnishings.json`, both plans and `index.html`; it reports missing images.
5. Commit and push as usual.

## Files

- `index.html`: generated, do not edit by hand.
- `src/template.html`: page design and scripts.
- `src/build.mjs`, `src/menu-data.mjs`: build and menu reader.
- `src/crockery-source.html`: crockery data (the source of the Crockery tab).
- `src/plating_data.py`: plating specs and image prompts.
- `src/check-menu.mjs`, `src/menu.hash`: change detector used by the hook.
- `src/plating-variant-jobs.py`, `src/gen-variants.sh`: prompts and runner for the option photos and the drinks that had none.
- `src/build-menus.py`, `src/menus.css`: the old photo-menu builder (outputs deleted 2026-10-22, do not run).
