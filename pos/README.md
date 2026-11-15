# Konso POS

A complete point-of-sale for the pub that runs on one counter computer and works on every tablet and phone on the same Wi-Fi.
No internet, no subscription, no installs beyond Node.js.

**What it does**

| Area | Features |
|---|---|
| Orders | Table floor (W1–W4, bar B1–B4, garden G1–G2), takeaway and delivery, guests per table, notes, move and merge tables, long-press an item for quantity, note or 86 |
| Kitchen and bar | **Smart KDS replaces paper KOT and BOT.** Every dish goes to its station (wok, stock pots, fryer, steamer, cold, bar) on a hot-line screen, a bar screen and a pass screen. Slow dishes start first so a table's plates finish together, mains wait for the starters, a ticket turns amber and red against that dish's own cook time, allergy notes show in red, and the pass shows READY TO RUN per table. If a screen goes offline the KOT prints on the kitchen or bar printer. A cancelled dish shows as a red CANCELLED card on the screens until someone taps OK. See below. |
| Billing | GST tax invoice for food and soft drinks, a separate VAT invoice for liquor, financial-year invoice series, B2B invoices with customer GSTIN, discounts before tax, optional service charge, round-off, reprints marked DUPLICATE |
| Payments | Cash (with change), UPI, card, split payments, refunds, cash drawer kick |
| Stock | Recipes per menu item deduct stock on every KOT (beer by the litre, spirits by the ml); purchases update stock and average cost; waste, corrections and full stock takes; low-stock alerts |
| Vendors | Vendor list, purchase bills, payments, ledger and amounts owed |
| Staff | PIN login, five roles (owner, manager, cashier, waiter, kitchen), manager PIN to approve voids and discounts, clock in and out, hours, sales per person |
| Money | Dashboard, day close with cash count and Z report, expenses, profit snapshot |
| Reports | Daily revenue, items, categories, hours, payments, staff, GST summary (B2B and B2C by rate), B2B invoices, HSN/SAC summary, documents issued (GSTR-1 table 13), VAT register, all invoices, purchases, stock valuation, stock movement, menu costing, voids and audit, expenses. All export to CSV |

## Start it

1. Install **Node.js 22.13 or newer** (LTS from nodejs.org). Nothing else is needed: the database is built into Node.
2. On the counter computer, double-click **`Start POS.command`** (Mac), or run `node server.js` in this folder.
3. It prints two addresses. Open `http://localhost:8080` on the counter. On tablets and the kitchen screen, open the `http://192.168.x.x:8080` address, then use "Add to Home Screen".
4. Log in with PIN **1234** (the Owner account). Change it immediately: *My PIN* at the bottom of the menu.
5. Go to **Settings → Business & tax** and fill in your GSTIN, FSSAI number, VAT TIN and excise licence. Then add your staff under **Staff**.

Give the counter computer a fixed IP address on the router so the tablet link never changes.

## Bill printers

Any ESC/POS thermal printer works (Epson TM-T82/T88, TVS RP 3160, Posiflex, Rugtek, Everycom and similar), 80 mm or 58 mm. Set each printer under **Settings → Printers** (Bills, Kitchen KOT, Bar BOT):

- **Network (best).** A LAN or Wi-Fi printer with a fixed IP, port 9100. Prints silently, cuts the paper and opens the cash drawer.
- **System queue.** A USB printer plugged into the counter Mac or Linux PC, added as a raw printer. Run `lpstat -p` to find its queue name.
- **Browser.** Opens the normal print dialog. Use this for Windows USB printers, Bluetooth printers or tablets. Set the paper size to 80 mm once.

Use **Test print** to check each one.

## Tax setup: confirm these with your CA before opening

- **Food and non-alcoholic drinks**: GST 5% (CGST 2.5% + SGST 2.5%), SAC 996331, no input tax credit. This is set up.
- **Alcohol** is outside GST and is billed on a separate **VAT invoice** under the Goa VAT Act. The rate is set to **22% as a placeholder**. Confirm the current Goa VAT rate on liquor sold in bars and restaurants and change it under **Settings → Tax rates**.
- **Composition scheme** is available (the bill becomes a "Bill of Supply" with no GST), but a business that also sells liquor can't opt for composition. Stay on Regular once the bar licence is active.
- **Bill layout** defaults to *tax-inclusive*: each item prints at its price including tax, with no CGST, SGST or VAT lines in the body, and one footnote with the taxable value and tax. The rules for GST tax invoices (Rule 46) and VAT invoices require the rate and amount of tax, so that note stays. Switch to separate tax lines under **Settings → Business & tax → How taxes show on the bill**.
- **Service charge** defaults to 0. Under the CCPA guidelines it can't be added automatically, so only apply it when the guest agrees.
- **Invoice numbers** run per financial year (`DD/26-27/00001` for GST, `DDL/26-27/00001` for liquor) and never reuse a number. Cancelled invoices stay on record with a reason, as GST requires.
- **E-invoicing** (IRN/QR) only applies above ₹5 crore turnover, so it isn't built in.

## Backups

All data lives in `data/pos.db`. The server copies it to `data/backups/` once a day and at every day close, and keeps the last 60 copies. Copy that folder to Google Drive or a USB drive every week. **Settings → Backup & audit** also downloads a copy.

`data/` is in `.gitignore`, so sales data never goes to GitHub.

## Daily routine

1. Staff clock in on the login screen: type the PIN, then tap *Clock in / out*.
2. During service: Tables, then a table, then items, then **Send KOT**, then **Print bill**, then **Pay**.
3. Receive deliveries under **Purchases → Receive goods**, and log waste under **Inventory**.
4. At closing, open **Day close**, count the drawer, then *Close day*. This prints the Z report and makes a backup.
5. Once a week, do a **Stock take** and check **Reports → Stock movement** for missing stock.

## Files

```
server.js        HTTP server and API
lib/db.js        SQLite schema, transactions, backups
lib/core.js      settings, time and trading day, PIN auth, roles
lib/orders.js    order lifecycle, KOT, stock deduction, invoicing, payments
lib/print.js     bill, KOT and Z layouts plus the ESC/POS encoder and printer output
lib/reports.js   all reports and the day-close figures
lib/seed.js      first-run tables, taxes and staff; loads lib/menu-data.js
lib/menu-data.js the menu, stock items and recipes (source: Garden/menu/build.py and Garden/web/stock-plan.html)
scripts/apply-new-menu.js  moves an existing database onto menu-data.js (backs up first, hides old items)
public/calc.js   bill maths shared by the server and the browser
public/js/*.js   the app screens
```


## Smart kitchen and bar display (KDS)

Open these on wall-mounted screens or tablets (Add to Home Screen). Each one needs a PIN login with the kitchen, cashier, manager or owner role, so give the kitchen a `kitchen` staff account.

| Screen | Address | For |
|---|---|---|
| Hot line | `http://<counter-ip>:8080/#/kds/hot` | Wok, stock pots, fryer, steamer, cold and dessert. Filter buttons narrow it to one station. |
| Bar | `http://<counter-ip>:8080/#/kds/bar` | Bottled beer, spirits, cocktails, coffee, zero-proof. |
| Pass | `http://<counter-ip>:8080/#/kds/pass` | Every table at once: cooking, ready, held. Mark a course **Served**; fire the next course early. |

**How it decides**

- **Station and time.** Each menu item has a *Cooked at* station, a *usual cook time* and a *course*, set automatically from the category and name the first time the POS starts. Change any of them under **Menu → edit item**.
- **Start order.** Dishes of the same course on one table are timed together: the slowest starts now, the faster ones show "start in 1:58" and light up green when it is time.
- **Courses.** On dine-in tables, mains and dessert are held until the earlier course is ready and the gap has passed (default 8 minutes, **Settings → Printers**). A held course always fires after 35 minutes. **Send & fire all** at the till skips holding; **Fire next course now** on the pass fires it early. Takeaway and delivery are never held.
- **Colours.** A ticket turns amber when it passes the longest cook time on it and red three minutes after that. A red box means an allergy or diet note.
- **Sound.** New ticket on the hot line or bar; a double chime on the pass when a table is ready. Tap the screen once after it loads, because browsers block sound until then.
- **Stock.** Sending an order still deducts the recipe from stock, exactly as before.
- **Cancels.** Cancelling a dish at the till shows a red CANCELLED card on the right screens for ten minutes (it pulses and chimes). Tap OK to clear it.
- **Recent** brings back a served ticket by mistake.
- **Paper.** Paper KOT and BOT are off by default. If the kitchen or bar screen has not checked in for 90 seconds and the kitchen or bar printer is a Network or System printer, that ticket prints instead, and the waiter sees a message. A *Browser* printer is never used as the fallback, because it would open a print dialog on the waiter's tablet.

Test it without touching real data: `POS_DATA=/tmp/pos-test PORT=8099 node server.js`.
