// The Cabin East menu, stock items and recipes, one source for both the first-run seed and
// scripts/apply-new-menu.js (which moves an existing database onto this menu).
// Menu: Garden/menu/build.py (the published picture menu). Stock list: Garden/web/stock-plan.html.
// Prices come from the menu. Stock quantities are the stock plan's pars for 60 covers a day; costs are estimates:
// replace them with real purchase costs the first time you receive each item.

export const CATS = [
  ['Dim sum & bao', 'kitchen'], ['From the wok', 'kitchen'], ['Soups & salads', 'kitchen'], ['Mains', 'kitchen'],
  ['For the table', 'kitchen'], ['Dessert', 'kitchen'],
  ['Beer', 'bar'], ['Cocktails', 'bar'], ['Zero proof', 'bar'], ['Whisky & vodka', 'bar'], ['Coffee', 'bar'], ['Happy hour', 'bar'],
];

const V = 1, NV = 0, F = 'food', L = 'liquor';
// [category, name, price, veg, tax, hsn override]. Variants are written "Dish · variant" so the kitchen screen can find the dish.
export const MENU = [
  ['Dim sum & bao', 'Crystal Clear', 220, V, F], ['Dim sum & bao', 'Siu Mai Goodness', 300, NV, F],
  ['Dim sum & bao', 'Fire Starters', 280, NV, F], ['Dim sum & bao', 'Prawn to Be Wild', 340, NV, F],
  ['Dim sum & bao', 'Bao Down', 320, NV, F], ['Dim sum & bao', 'Seoul Mate', 260, V, F], ['Dim sum & bao', 'Fever Pitch', 280, NV, F],

  ['From the wok', 'Cabin Fever · paneer', 280, V, F], ['From the wok', 'Cabin Fever · chicken', 320, NV, F], ['From the wok', 'Cabin Fever · pork belly', 360, NV, F],
  ['From the wok', 'Honey Trap · potato', 220, V, F], ['From the wok', 'Honey Trap · chicken', 320, NV, F],
  ['From the wok', 'Fry Hard', 240, V, F],
  ['From the wok', 'Wonton More · veg', 240, V, F], ['From the wok', 'Wonton More · chicken', 260, NV, F],
  ['From the wok', 'Salt & Pepa · mushroom', 260, V, F], ['From the wok', 'Salt & Pepa · chonak', 420, NV, F], ['From the wok', 'Salt & Pepa · prawns', 460, NV, F],
  ['From the wok', 'K-Pop Wings', 380, NV, F],

  ['Soups & salads', 'Smash Hit', 160, V, F],
  ['Soups & salads', 'Hot & Bothered · veg', 180, V, F], ['Soups & salads', 'Hot & Bothered · chicken', 210, NV, F],
  ['Soups & salads', 'Wonton Kenobi', 220, NV, F],
  ['Soups & salads', 'Coconut Cuddle · veg', 220, V, F], ['Soups & salads', 'Coconut Cuddle · chicken', 250, NV, F],
  ['Soups & salads', 'Slap Happy', 240, V, F],

  ['Mains', 'Noodle Around · veg', 240, V, F], ['Mains', 'Noodle Around · chicken', 280, NV, F], ['Mains', 'Noodle Around · mixed', 340, NV, F],
  ['Mains', 'Rice Rice Baby · veg', 240, V, F], ['Mains', 'Rice Rice Baby · chicken', 280, NV, F], ['Mains', 'Rice Rice Baby · mixed', 320, NV, F],
  ['Mains', 'Gravy Train · veg', 260, V, F], ['Mains', 'Gravy Train · chicken', 300, NV, F],
  ['Mains', 'Sweet Talk · paneer', 260, V, F], ['Mains', 'Sweet Talk · chicken', 300, NV, F],
  ['Mains', 'Green With Envy · veg', 300, V, F], ['Mains', 'Green With Envy · chicken', 340, NV, F], ['Mains', 'Green With Envy · prawn', 440, NV, F],
  ['Mains', 'Holy Basil, Batman!', 320, NV, F],
  ['Mains', 'Suey Generis · veg', 320, V, F], ['Mains', 'Suey Generis · chicken', 360, NV, F],
  ['Mains', 'Plain Jane', 120, V, F],

  ['For the table', 'Steamer for two', 799, NV, F], ['For the table', 'Cabin feast for four', 2299, NV, F],
  ['For the table', 'Bowl Game · chicken', 440, NV, F], ['For the table', 'Bowl Game · paneer', 380, V, F], ['For the table', 'Bowl Game · green curry', 360, V, F],

  ['Dessert', 'Honey, I Shrunk the Noodles', 220, V, F], ['Dessert', 'Sticky Situation', 220, V, F], ['Dessert', 'Scoop There It Is', 150, V, F],

  ['Beer', 'Kings 330 ml', 120, V, L, '2203'], ['Beer', 'Kings 650 ml', 180, V, L, '2203'],
  ['Beer', 'Budweiser 330 ml', 180, V, L, '2203'], ['Beer', 'Budweiser 650 ml', 260, V, L, '2203'],
  ['Beer', 'Corona Extra', 320, V, L, '2203'], ['Beer', 'Hoegaarden', 340, V, L, '2203'],
  ['Beer', 'Comrade Crisp', 260, V, L, '2203'], ['Beer', 'Gose Bumps', 300, V, L, '2203'],
  ['Beer', 'Eight Finger Eddie IPA', 320, V, L, '2203'], ['Beer', 'Vanilla Porter', 320, V, L, '2203'],
  ['Beer', 'Bucket of Five · Kings 330 ml', 499, V, L, '2203'], ['Beer', 'Bucket of Five · Budweiser 330 ml', 749, V, L, '2203'],

  ['Cocktails', 'Kokum Feni Sour', 420, V, L], ['Cocktails', 'Somaek', 360, V, L], ['Cocktails', 'Coconut Feni Highball', 380, V, L],
  ['Cocktails', 'Sichuan G&T', 420, V, L], ['Cocktails', 'Soju Yakult', 420, V, L], ['Cocktails', 'Kimchi Mary', 420, V, L],
  ['Cocktails', 'Lychee & Lemongrass Martini', 440, V, L], ['Cocktails', 'Tamarind Chilli Margarita', 460, V, L],

  ['Zero proof', 'Fresh Lime Soda', 120, V, F], ['Zero proof', 'Kokum Soda', 140, V, F], ['Zero proof', 'Lemongrass-Ginger Iced Tea', 160, V, F],
  ['Zero proof', 'Tonic', 120, V, F], ['Zero proof', 'Ginger Ale', 120, V, F], ['Zero proof', 'Soft Drink', 80, V, F],
  ['Zero proof', 'Water, still 1 L', 60, V, F], ['Zero proof', 'Water, sparkling 330 ml', 120, V, F],

  ['Whisky & vodka', 'Dewar\'s White Label 30ml', 200, V, L], ['Whisky & vodka', 'Dewar\'s White Label 60ml', 380, V, L],
  ['Whisky & vodka', 'House Infused Vodka 30ml', 240, V, L], ['Whisky & vodka', 'House Infused Vodka 60ml', 440, V, L],
  ['Whisky & vodka', 'Jameson 30ml', 280, V, L], ['Whisky & vodka', 'Jameson 60ml', 520, V, L],
  ['Whisky & vodka', 'Paul John Brilliance 30ml', 320, V, L], ['Whisky & vodka', 'Paul John Brilliance 60ml', 600, V, L],
  ['Whisky & vodka', 'Glenlivet 12 30ml', 420, V, L], ['Whisky & vodka', 'Glenlivet 12 60ml', 800, V, L],
  ['Whisky & vodka', 'Suntory Toki Highball', 420, V, L],
  ['Whisky & vodka', 'Talisker 10 30ml', 520, V, L], ['Whisky & vodka', 'Talisker 10 60ml', 1000, V, L],
  ['Whisky & vodka', 'Single Malt Flight', 650, V, L],

  ['Coffee', 'Brewed Coffee · black', 120, V, F], ['Coffee', 'Brewed Coffee · with milk', 140, V, F], ['Coffee', 'Irish Coffee', 360, V, L],

  // Happy hour, 12 to 6: beer only
  ['Happy hour', 'HH Kings 330 ml', 99, V, L, '2203'], ['Happy hour', 'HH Budweiser 330 ml', 149, V, L, '2203'],
];

export const VENDORS = [
  ['Susegado Brewing', 'Calangute, Goa', 'Bottles: Gose Bumps, Vanilla Porter', 'Confirm bottle size, case size, minimum order, delivery to Gandaulim'],
  ['Goa Brewing Co.', 'Sangolda, Goa', 'Bottles: Comrade Crisp, Eight Finger Eddie IPA', 'Confirm bottle size, case size, minimum order'],
];

// [name, category, unit, par (stock plan, 60 covers), cost per unit (estimate), vendor index or null]
// Reorder level is half of par (the stock plan's order rule). Opening quantity is the par.
export const STOCK = [
  // Beer, bottles (330 ml assumed for craft)
  ['Kings 330 ml', 'Beer', 'pc', 72, 70], ['Kings 650 ml', 'Beer', 'pc', 24, 110], ['Budweiser 330 ml', 'Beer', 'pc', 48, 95], ['Budweiser 650 ml', 'Beer', 'pc', 12, 150],
  ['Corona Extra 330 ml', 'Beer', 'pc', 48, 190], ['Hoegaarden 330 ml', 'Beer', 'pc', 48, 200],
  ['Comrade Crisp 330 ml', 'Beer', 'pc', 48, 150, 1], ['Gose Bumps 330 ml', 'Beer', 'pc', 48, 170, 0],
  ['Eight Finger Eddie IPA 330 ml', 'Beer', 'pc', 24, 180, 1], ['Vanilla Porter 330 ml', 'Beer', 'pc', 24, 180, 0],
  // Spirits, in ml (750 ml bottles; par = bottles x 750)
  ['Paul John Brilliance', 'Spirits', 'ml', 2250, 4.2], ['Glenlivet 12', 'Spirits', 'ml', 2250, 5.6], ['Talisker 10', 'Spirits', 'ml', 2250, 7.2],
  ['Dewar\'s White Label', 'Spirits', 'ml', 4500, 2.4], ['Jameson', 'Spirits', 'ml', 3000, 3.6], ['Suntory Toki', 'Spirits', 'ml', 3000, 5.0],
  ['Base vodka (infusions, martini, Kimchi Mary)', 'Spirits', 'ml', 3000, 1.6], ['Gin', 'Spirits', 'ml', 3000, 2.4],
  ['Cashew feni', 'Spirits', 'ml', 3000, 0.8], ['Coconut feni', 'Spirits', 'ml', 2250, 0.9], ['Agave spirit', 'Spirits', 'ml', 2250, 4.0], ['Soju', 'Spirits', 'ml', 6000, 0.95],
  // Mixers and soft drinks
  ['Soda water 300ml', 'Beverages', 'pc', 72, 12], ['Indian tonic water 200ml', 'Beverages', 'pc', 48, 25], ['Ginger ale 200ml', 'Beverages', 'pc', 24, 25],
  ['Soft drinks 300ml', 'Beverages', 'pc', 96, 25], ['Still water 1 L', 'Beverages', 'pc', 48, 20], ['Sparkling water 330ml', 'Beverages', 'pc', 24, 55],
  ['Coffee beans', 'Beverages', 'kg', 3, 900], ['Tomato juice', 'Beverages', 'L', 4, 120], ['Yakult', 'Beverages', 'pc', 20, 12],
  ['Milk', 'Dairy', 'L', 4, 60], ['Fresh cream', 'Dairy', 'L', 2, 220],
  ['Limes', 'Veg', 'pc', 80, 4], ['Lemons', 'Veg', 'pc', 20, 8], ['Grapefruit', 'Veg', 'pc', 10, 40], ['Ice', 'Beverages', 'kg', 30, 8],
  // Kitchen: protein
  ['Chicken thigh boneless', 'Meat', 'kg', 6, 320], ['Chicken wings', 'Meat', 'kg', 2, 260], ['Pork belly', 'Meat', 'kg', 2, 420], ['Chouriço', 'Meat', 'kg', 0.5, 600],
  ['Tiger prawns', 'Seafood', 'kg', 4, 900], ['Chonak fillet', 'Seafood', 'kg', 0.8, 950],
  // Kitchen: dairy, veg, frozen
  ['Paneer', 'Dairy', 'kg', 1.2, 380], ['Eggs', 'Dairy', 'pc', 60, 7], ['Cheese, melting', 'Dairy', 'kg', 1, 450],
  ['Button mushrooms', 'Veg', 'kg', 1.5, 220], ['Tofu, firm', 'Veg', 'kg', 0.8, 160], ['Potato', 'Veg', 'kg', 4, 35], ['French fries, frozen', 'Frozen', 'kg', 4, 180],
  ['Bao buns', 'Bakery', 'pc', 40, 9], ['Dim sum wrappers', 'Dry', 'pc', 100, 1.5], ['Wonton wrappers', 'Dry', 'pc', 200, 1.2],
  ['Vanilla ice cream', 'Frozen', 'L', 10, 220], ['Tender coconut ice cream', 'Frozen', 'L', 10, 300], ['Kokum ice cream', 'Frozen', 'L', 10, 300],
  // Kitchen: dry
  ['Rice', 'Dry', 'kg', 12, 90], ['Thin noodles (Hakka)', 'Dry', 'kg', 3, 120], ['Egg noodles', 'Dry', 'kg', 1.5, 140], ['Flat noodles', 'Dry', 'kg', 1.5, 140],
  ['Coconut milk', 'Dry', 'L', 8, 220], ['Cooking oil', 'Dry', 'L', 60, 150],
];

// [menu item, stock item, qty per sale]. Quantities are portion estimates: set them from your recipe cards.
const R = [];
const r = (item, stock, qty) => R.push([item, stock, qty]);
r('Crystal Clear', 'Dim sum wrappers', 4);
r('Siu Mai Goodness', 'Dim sum wrappers', 4); r('Siu Mai Goodness', 'Chouriço', 0.04); r('Siu Mai Goodness', 'Chicken thigh boneless', 0.04);
r('Fire Starters', 'Wonton wrappers', 5); r('Fire Starters', 'Chicken thigh boneless', 0.06);
r('Prawn to Be Wild', 'Dim sum wrappers', 4); r('Prawn to Be Wild', 'Tiger prawns', 0.08);
r('Bao Down', 'Pork belly', 0.12); r('Bao Down', 'Bao buns', 2);
r('Seoul Mate', 'Paneer', 0.1); r('Seoul Mate', 'Bao buns', 2);
r('Fever Pitch', 'Chicken thigh boneless', 0.1); r('Fever Pitch', 'Bao buns', 2);
r('Cabin Fever · paneer', 'Paneer', 0.18); r('Cabin Fever · chicken', 'Chicken thigh boneless', 0.22); r('Cabin Fever · chicken', 'Eggs', 1);
r('Cabin Fever · pork belly', 'Pork belly', 0.2);
r('Honey Trap · potato', 'Potato', 0.25); r('Honey Trap · chicken', 'Chicken thigh boneless', 0.2);
r('Fry Hard', 'French fries, frozen', 0.25); r('Fry Hard', 'Cheese, melting', 0.05);
r('Wonton More · veg', 'Wonton wrappers', 6); r('Wonton More · chicken', 'Wonton wrappers', 6); r('Wonton More · chicken', 'Chicken thigh boneless', 0.06);
r('Salt & Pepa · mushroom', 'Button mushrooms', 0.2); r('Salt & Pepa · chonak', 'Chonak fillet', 0.15); r('Salt & Pepa · prawns', 'Tiger prawns', 0.15);
r('K-Pop Wings', 'Chicken wings', 0.35);
r('Hot & Bothered · veg', 'Button mushrooms', 0.05); r('Hot & Bothered · veg', 'Tofu, firm', 0.05); r('Hot & Bothered · veg', 'Eggs', 0.5);
r('Hot & Bothered · chicken', 'Chicken thigh boneless', 0.06); r('Hot & Bothered · chicken', 'Eggs', 0.5);
r('Wonton Kenobi', 'Wonton wrappers', 5); r('Wonton Kenobi', 'Chicken thigh boneless', 0.06);
r('Coconut Cuddle · veg', 'Coconut milk', 0.15); r('Coconut Cuddle · veg', 'Button mushrooms', 0.05);
r('Coconut Cuddle · chicken', 'Coconut milk', 0.15); r('Coconut Cuddle · chicken', 'Chicken thigh boneless', 0.08);
r('Noodle Around · veg', 'Thin noodles (Hakka)', 0.16); r('Noodle Around · chicken', 'Thin noodles (Hakka)', 0.16); r('Noodle Around · chicken', 'Chicken thigh boneless', 0.08);
r('Noodle Around · mixed', 'Thin noodles (Hakka)', 0.16); r('Noodle Around · mixed', 'Chicken thigh boneless', 0.06); r('Noodle Around · mixed', 'Tiger prawns', 0.04); r('Noodle Around · mixed', 'Eggs', 1);
r('Rice Rice Baby · veg', 'Rice', 0.18); r('Rice Rice Baby · chicken', 'Rice', 0.18); r('Rice Rice Baby · chicken', 'Chicken thigh boneless', 0.08); r('Rice Rice Baby · chicken', 'Eggs', 1);
r('Rice Rice Baby · mixed', 'Rice', 0.18); r('Rice Rice Baby · mixed', 'Chicken thigh boneless', 0.06); r('Rice Rice Baby · mixed', 'Tiger prawns', 0.04); r('Rice Rice Baby · mixed', 'Eggs', 1);
r('Gravy Train · chicken', 'Chicken thigh boneless', 0.12);
r('Sweet Talk · paneer', 'Paneer', 0.12); r('Sweet Talk · chicken', 'Chicken thigh boneless', 0.12);
r('Green With Envy · veg', 'Coconut milk', 0.2); r('Green With Envy · chicken', 'Coconut milk', 0.2); r('Green With Envy · chicken', 'Chicken thigh boneless', 0.12);
r('Green With Envy · prawn', 'Coconut milk', 0.2); r('Green With Envy · prawn', 'Tiger prawns', 0.1);
r('Holy Basil, Batman!', 'Chicken thigh boneless', 0.15); r('Holy Basil, Batman!', 'Eggs', 1); r('Holy Basil, Batman!', 'Rice', 0.18);
r('Suey Generis · veg', 'Egg noodles', 0.16); r('Suey Generis · veg', 'Coconut milk', 0.2);
r('Suey Generis · chicken', 'Egg noodles', 0.16); r('Suey Generis · chicken', 'Coconut milk', 0.2); r('Suey Generis · chicken', 'Chicken thigh boneless', 0.1);
r('Plain Jane', 'Rice', 0.18);
r('Steamer for two', 'Dim sum wrappers', 8); r('Steamer for two', 'Bao buns', 2);
r('Bowl Game · chicken', 'Chicken thigh boneless', 0.22); r('Bowl Game · chicken', 'Rice', 0.18);
r('Bowl Game · paneer', 'Paneer', 0.18); r('Bowl Game · paneer', 'Rice', 0.18);
r('Bowl Game · green curry', 'Coconut milk', 0.2); r('Bowl Game · green curry', 'Rice', 0.18);
r('Honey, I Shrunk the Noodles', 'Flat noodles', 0.06); r('Honey, I Shrunk the Noodles', 'Vanilla ice cream', 0.08);
r('Sticky Situation', 'Vanilla ice cream', 0.08); r('Scoop There It Is', 'Vanilla ice cream', 0.1);
// Beer
for (const [item, stock] of [['Kings 330 ml', 'Kings 330 ml'], ['Kings 650 ml', 'Kings 650 ml'], ['Budweiser 330 ml', 'Budweiser 330 ml'], ['Budweiser 650 ml', 'Budweiser 650 ml'],
  ['Corona Extra', 'Corona Extra 330 ml'], ['Hoegaarden', 'Hoegaarden 330 ml'], ['Comrade Crisp', 'Comrade Crisp 330 ml'], ['Gose Bumps', 'Gose Bumps 330 ml'],
  ['Eight Finger Eddie IPA', 'Eight Finger Eddie IPA 330 ml'], ['Vanilla Porter', 'Vanilla Porter 330 ml'],
  ['HH Kings 330 ml', 'Kings 330 ml'], ['HH Budweiser 330 ml', 'Budweiser 330 ml']]) r(item, stock, 1);
r('Bucket of Five · Kings 330 ml', 'Kings 330 ml', 5); r('Bucket of Five · Kings 330 ml', 'Ice', 3);
r('Bucket of Five · Budweiser 330 ml', 'Budweiser 330 ml', 5); r('Bucket of Five · Budweiser 330 ml', 'Ice', 3);
// Cocktails and zero proof
r('Kokum Feni Sour', 'Cashew feni', 60); r('Kokum Feni Sour', 'Limes', 1);
r('Somaek', 'Soju', 45); r('Somaek', 'Kings 330 ml', 1);
r('Coconut Feni Highball', 'Coconut feni', 60); r('Coconut Feni Highball', 'Soda water 300ml', 1);
r('Sichuan G&T', 'Gin', 60); r('Sichuan G&T', 'Indian tonic water 200ml', 1); r('Sichuan G&T', 'Grapefruit', 0.25);
r('Soju Yakult', 'Soju', 60); r('Soju Yakult', 'Yakult', 1); r('Soju Yakult', 'Limes', 0.5);
r('Kimchi Mary', 'Base vodka (infusions, martini, Kimchi Mary)', 60); r('Kimchi Mary', 'Tomato juice', 0.12);
r('Lychee & Lemongrass Martini', 'Base vodka (infusions, martini, Kimchi Mary)', 60); r('Lychee & Lemongrass Martini', 'Limes', 0.5);
r('Tamarind Chilli Margarita', 'Agave spirit', 60); r('Tamarind Chilli Margarita', 'Limes', 1);
r('Fresh Lime Soda', 'Limes', 2); r('Fresh Lime Soda', 'Soda water 300ml', 1); r('Kokum Soda', 'Soda water 300ml', 1);
r('Tonic', 'Indian tonic water 200ml', 1); r('Ginger Ale', 'Ginger ale 200ml', 1); r('Soft Drink', 'Soft drinks 300ml', 1);
r('Water, still 1 L', 'Still water 1 L', 1); r('Water, sparkling 330 ml', 'Sparkling water 330ml', 1);
// Whisky and vodka
for (const [name, stock] of [['Dewar\'s White Label', 'Dewar\'s White Label'], ['House Infused Vodka', 'Base vodka (infusions, martini, Kimchi Mary)'], ['Jameson', 'Jameson'],
  ['Paul John Brilliance', 'Paul John Brilliance'], ['Glenlivet 12', 'Glenlivet 12'], ['Talisker 10', 'Talisker 10']]) { r(`${name} 30ml`, stock, 30); r(`${name} 60ml`, stock, 60); }
r('Suntory Toki Highball', 'Suntory Toki', 60); r('Suntory Toki Highball', 'Soda water 300ml', 1); r('Suntory Toki Highball', 'Lemons', 0.25);
r('Single Malt Flight', 'Paul John Brilliance', 20); r('Single Malt Flight', 'Glenlivet 12', 20); r('Single Malt Flight', 'Talisker 10', 20);
// Coffee
r('Brewed Coffee · black', 'Coffee beans', 0.012); r('Brewed Coffee · with milk', 'Coffee beans', 0.012); r('Brewed Coffee · with milk', 'Milk', 0.06);
r('Irish Coffee', 'Jameson', 45); r('Irish Coffee', 'Coffee beans', 0.012); r('Irish Coffee', 'Fresh cream', 0.04);
export const RECIPES = R;
