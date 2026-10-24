# Cabin East Garden

A 3D model of the Garden restaurant: an open-sided pub hall with its bar, kitchen, dish wash, washroom and store room. Built in the same style, lighting and palette as the Simplex model.

Live: https://singhgenics.github.io/Garden/ (opens `garden.html`)

Decor concept: https://singhgenics.github.io/Garden/decor.html (also linked from the model's toolbar)

## What is in the model

| Part | Size (m) | Notes |
|---|---|---|
| Main restaurant | 15.67 × 7.76 (irregular) | 5 square tables for 4 + 2 family tables for 6 (1.9 × 0.9 m, 3 chairs facing 3) = **32 covers** (cap 35). Open on three sides, solid 15.67 m north wall |
| Decor wall | 15.67 | As on site: hand-painted tile dado (0.95 m, damask and blue/yellow patchwork bays) and white fluted pilasters on plinths; the colours above are repainted bottle green, with brass sconces, a salon hang and a chalkboard |
| TV corner | NW corner | The only TV: a 65 in screen set exactly on the diagonal where the decor wall meets the 7.76 m open side, on a slatted timber section |
| Bar | counter zone, 4.8 long | The existing counter in exposed red brick (the tan ply on site is temporary): brick pilasters, a brick end pier, dark timber top with brass edge, velvet stools, 3 craft taps on one brass font, floating glass rack; back bar with labelled bottles, infusion jars, lit cooler, ON TAP board |
| Entrance | middle of the 9.20 m open edge | 1.70 m opening in the balustrade, PVC strip door |
| Open edges | all five | White turned Goan pillars on pedestals and an 80 cm balustrade (navy balusters, white rail), as on site |
| Floor and ceiling | hall | Blue-grey granite in 60 cm tiles; flat white ceiling with white dropped beams, dark walnut false-beams and an interlocking square-frame feature light, as on site |
| Front | gate to hall | From the marked survey plan: arched whitewashed gateway (1.70 m, blue gable, sign) on the Cavelossim-Assolna road; main path east to the residence veranda; 5 × 5 m garden on its north side below the hall's 2.98 m edge; a 1.20 m stepping-stone approach path (about 5.5 m, to confirm) north to the 5 × 5 m red-oxide landing between the hall wing and the existing restaurant; the hall entrance faces the landing. Existing restaurant and residence shown as massing |
| Kitchen | 5.41 × 4.38 | Cooking line under one hood, prep island, refrigeration, pass window |
| Dish wash | 5.41 × 2.00 | Hatch, receiving table, double sink, hood dishwasher, clean table |
| Washroom | 2.96 × 1.70 | Sage-tile WC and marble basin, with a hand-wash lobby |
| Store room | 2.70 × 6.46 | Steel racking, door into the kitchen |
| Pathway | about 1.00 wide | Between the bar and the kitchen block, open |

Every open side closes with roll-down clear PVC (button in the toolbar rolls them up or down). The roof is low, so there are no ceiling fans: misting fans on the pillars and two vertical tower ACs cool the hall.

## Using it

- Camera buttons jump to the decor wall, TV corner, gate, entrance, bar, kitchen, dish wash, washroom, store room, from outside and the plan.
- **Walk in** gives a first-person walk (W A S D, arrow pad on phones). Walls and doors block you.
- The Lighting panel (Lunch, Sunset, Evening, Late, plus Time and Lights sliders) works as in Simplex: warm 2700 K fittings. Sizes shows the plan dimensions.
- URL options: `?view=kitchen`, `?time=night`, `?pvc=up`, `?roof=0`, `?sizes`.

## Sizes: where they come from

Hall edges (15.67, 7.76, 4.71, 2.98, 5.45, 9.20), the counter length (5.48), the kitchen block width (5.41 = 2.45 + 2.96), the washroom (2.96 × 1.70) and the 6.38 m block depth are printed on the survey plan. The store room (2.70 × 6.46) was given separately. The front (gate 1.70, garden 5 × 5, approach path 1.20, landing 5 × 5, positions from the marked survey plan), the 80 cm railing and the finishes (pillars, tiles, ceiling, brick counter) come from the site videos of 24 Oct 2026. The dish wash / kitchen depths (2.00 / 4.38), the pathway width (about 1.00), the counter zone width (2.10), wall and ceiling heights, and the roof shape are estimates or design choices, to be confirmed on site.

## Files

- `garden.html`: the whole model (three.js r128, no build step)
- `index.html`: redirects to `garden.html`
- `decor.html` + `decor/`: the interior decor concept, Google Flow renders made from the model's camera views in the look of the Design Inspos boards, with a spec per zone. Source and image runner live in `../Decor` (outside this repo)
