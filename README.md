# cse3cwa-assignment-04

Autonomous supermarket simulation for CSE3CWA / CSE5006 Assignment 4. A React manager page reads one frozen 60-day run from SQLite. The Express API and the simulation that created that run are in `backend`.

## Run locally

Requires Node.js 18+.

Backend, in one terminal:

```bash
cd backend
npm install
npm start
```

The API is http://localhost:3001. The database file is `backend/data/supermarket.db`.

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

## Submitted run

Run **1** is the submitted run (`is_submitted = 1`). It starts on Monday 3 August 2026 and covers 60 days. The page always reads that run. `node save.js` will not create another submitted run while run 1 is already stored.

## Where to click

The navigation on http://localhost:5173 opens six views of run 1:

- **Model** — weekday customer counts, the four shopping missions, expiry batches, and the Store Brain reorder rules.
- **60-day report** — sales, profit, cash, inventory, weekday versus weekend, category results, and the strongest and weakest products.
- **Operations** — sold-out, low-stock, expiry, slow-mover, replenishment, and cash-constraint counts. Cash constraints are shown as zero because this run never cut an order.
- **Findings** — three recommendations. The ready-meal finding is the problem: sandwiches and sushi both stock out and get written off.
- **Daily** — one day at a time, days 1 to 60, with stock movement, the evening orders, and the first stored transactions.
- **Assurance** — PASS or FAIL for stock, revenue, and cash, plus the row counts kept for audit.

## How the pieces connect

`backend/catalogue.js` is the product range and the A$40,000 opening-inventory budget. `backend/customers.js` builds each day’s shoppers. `backend/simulate.js` runs the 60 mornings and evenings, and `backend/brain.js` records low stock, sold outs, expiry, slow movers, orders, and cash cuts. `backend/save.js` wrote that history into SQLite. `backend/reports.js` reads it back. The React page does not recalculate the 60 days; it displays the stored run.

## AI assistance

Cursor drafted the catalogue, the customer missions, the 60-day loop, the Store Brain rules, the database save, and these manager pages. The checks that were run locally and matched were the opening-inventory budget (A$36,612.50, under A$40,000), the Monday / Friday / Sunday customer counts, the stock and cash PASS lines from `node simulate.js`, and `GET /api/run` for run 1. The written findings use figures queried from that stored run.

## Limitation

Customer numbers and product demand are assumptions for a fictional CBD store. They are not measured traffic from Swanston Street. The cash-limit rule can cut an order, but run 1 never ran out of cash, so that rule was not observed in the submitted history.
