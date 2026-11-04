# Picture menu: menu engineering notes

Classes below are **assumptions** (food-cost bands from the menu notes, popularity from the pub's concept). The pub has not opened, so there is no sales data. After 4 weeks of POS data, re-class each dish by contribution margin and sales mix, then change `build.py`.

| Class | Dishes | Treatment on the page |
|---|---|---|
| Star (high margin, popular) | Cabin Fever, Siu Mai, Crystal Clear, Fire Starters, Bao Down, Fever Pitch, Honey Trap, K-Pop Wings, Noodle Around, Rice Rice Baby, Comrade Crisp, Gose Bumps | Biggest photos, top of page, tags (Bestseller, Signature) |
| Puzzle (high margin, needs a push) | Seoul Mate, Fry Hard, Slap Happy, Smash Hit, darsaan, Sticky Situation, Kokum feni sour | Photo or "Try this" tag, pairing line |
| Plowhorse (popular, thin margin) | Prawn and chonak dishes, Green With Envy prawn | Keep, no hero slot; prawn dumpling priced highest in its group |
| Dog (low margin, rarely ordered) | Spirits list, plain sides | Text only, compact two-column list at the end |

## Techniques used
- No currency symbols; prices sit at the end of the item name, not in a ruled column, so guests compare dishes not prices.
- Hero slot for the bestseller (Cabin Fever), with a pairing line (Gose Bumps).
- Price anchors: Prawn to Be Wild 340 beside Siu Mai 300; Cabin feast for four 2,299; Steamer for two 799.
- 3 to 5 photographed items per group; everything else is text.
- Highest-margin dish first in each group, second-best last; prices stay close together inside a group.
- Tags and boxes guide the eye to stars and puzzles only (max one tag per card).
- Happy hour banner sits next to the taps and links to dim sum.
- Veg and non-veg marks kept on every dish (FSSAI).
