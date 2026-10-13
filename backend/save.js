const { db, initDb } = require("./db");
const { PRODUCTS, OPENING_CASH, INVENTORY_BUDGET, openingCost } = require("./catalogue");
const { SEED, START_DATE, CUSTOMERS_BY_WEEKDAY, MISSIONS } = require("./customers");
const { DAY_COUNT, runSimulation } = require("./simulate");

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dollars(centsValue) {
  return centsValue / 100;
}

async function saveRun() {
  await initDb();
  const existing = await get("SELECT id FROM runs WHERE is_submitted = 1");
  if (existing) {
    console.log("submitted run already saved");
    console.log("run", existing.id);
    return;
  }

  const result = runSimulation();
  if (!result.stockOk) throw new Error("Stock check failed before saving");

  const config = {
    seed: SEED,
    startDate: START_DATE,
    dayCount: DAY_COUNT,
    openingCash: OPENING_CASH,
    inventoryBudget: INVENTORY_BUDGET,
    customersByWeekday: CUSTOMERS_BY_WEEKDAY,
    missions: MISSIONS,
    reorderCoverDays: 2,
    targetCoverDays: 7,
    slowMoverAfterDay: 14,
    slowMoverCoverDays: 45,
  };

  await run("BEGIN");
  try {
    const runId = await run(
      `INSERT INTO runs (
        created_at, status, seed, start_date, day_count, opening_cash,
        inventory_budget, opening_inventory_cost, config_json, is_submitted
      ) VALUES (?, 'complete', ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        new Date().toISOString(),
        SEED,
        START_DATE,
        DAY_COUNT,
        OPENING_CASH,
        INVENTORY_BUDGET,
        openingCost(PRODUCTS),
        JSON.stringify(config),
      ]
    );

    const productIds = {};
    for (const product of PRODUCTS) {
      productIds[product.sku] = await run(
        `INSERT INTO products (
          run_id, sku, name, category, unit_cost, unit_price, initial_qty,
          perishable, shelf_life_days, prior_daily
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runId,
          product.sku,
          product.name,
          product.category,
          product.unitCost,
          product.unitPrice,
          product.initialQty,
          product.perishable,
          product.shelfLifeDays,
          product.priorDaily,
        ]
      );
    }

    for (const day of result.days) {
      const weekend = day.weekday === "Saturday" || day.weekday === "Sunday" ? 1 : 0;
      await run(
        `INSERT INTO sim_days (
          run_id, day_number, sim_date, weekday, is_weekend, customers, transactions,
          units_sold, revenue, cogs, expiry_units, expiry_value, replenishment_units,
          replenishment_spend, opening_cash, closing_cash, closing_inventory_value,
          lost_units, mission_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runId,
          day.dayNumber,
          day.date,
          day.weekday,
          weekend,
          day.customers,
          day.transactions,
          day.unitsSold,
          dollars(day.revenueCents),
          dollars(day.cogsCents),
          day.expiryUnits,
          dollars(day.expiryValueCents),
          day.replenishmentUnits,
          dollars(day.replenishmentCents),
          dollars(day.openingCashCents),
          dollars(day.closingCashCents),
          dollars(day.closingInventoryCents),
          day.lostUnits,
          JSON.stringify(day.missionCounts),
        ]
      );

      for (const row of day.stock) {
        await run(
          `INSERT INTO daily_stock (
            run_id, day_number, product_id, opening_qty, received_qty, sold_qty,
            expired_qty, closing_qty, lost_qty, revenue, cogs
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            runId,
            day.dayNumber,
            productIds[row.sku],
            row.openingQty,
            row.receivedQty,
            row.soldQty,
            row.expiredQty,
            row.closingQty,
            row.lostQty,
            dollars(row.revenueCents),
            dollars(row.cogsCents),
          ]
        );
      }

      for (const sale of day.transactions) {
        const transactionId = await run(
          `INSERT INTO transactions (run_id, day_number, mission, units, revenue, cogs)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [runId, day.dayNumber, sale.mission, sale.units, dollars(sale.revenueCents), dollars(sale.cogsCents)]
        );
        for (const line of sale.lines) {
          await run(
            `INSERT INTO transaction_lines (
              transaction_id, run_id, day_number, product_id, qty, unit_price,
              unit_cost, revenue, cogs
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              transactionId,
              runId,
              day.dayNumber,
              productIds[line.sku],
              line.qty,
              dollars(line.unitPriceCents),
              dollars(line.unitCostCents),
              dollars(line.revenueCents),
              dollars(line.cogsCents),
            ]
          );
        }
      }

      for (const order of day.orders) {
        const product = PRODUCTS.find((item) => item.sku === order.sku);
        await run(
          `INSERT INTO replenishment_orders (
            run_id, product_id, order_day, arrival_day, qty_requested, qty_ordered,
            unit_cost, cost, cash_before, constrained, reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            runId,
            productIds[order.sku],
            order.orderDay,
            order.arrivalDay,
            order.qtyRequested,
            order.qtyOrdered,
            product.unitCost,
            dollars(order.costCents),
            dollars(order.cashBeforeCents),
            order.constrained,
            order.reason,
          ]
        );
      }
    }

    for (const event of result.events) {
      await run(
        `INSERT INTO brain_events (
          run_id, day_number, product_id, event_type, message, action, qty, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runId,
          event.dayNumber,
          productIds[event.sku],
          event.eventType,
          event.message,
          event.action,
          event.qty,
          event.amountCents === null ? null : dollars(event.amountCents),
        ]
      );
    }

    await run("COMMIT");

    const counts = await get(
      `SELECT
        (SELECT COUNT(*) FROM products WHERE run_id = ?) AS products,
        (SELECT COUNT(*) FROM sim_days WHERE run_id = ?) AS days,
        (SELECT COUNT(*) FROM daily_stock WHERE run_id = ?) AS stock_rows,
        (SELECT COUNT(*) FROM transactions WHERE run_id = ?) AS transactions,
        (SELECT COUNT(*) FROM transaction_lines WHERE run_id = ?) AS lines,
        (SELECT COUNT(*) FROM replenishment_orders WHERE run_id = ?) AS orders,
        (SELECT COUNT(*) FROM brain_events WHERE run_id = ?) AS events`,
      [runId, runId, runId, runId, runId, runId, runId]
    );
    const revenue = await get(
      `SELECT
        (SELECT ROUND(SUM(revenue) * 100) FROM sim_days WHERE run_id = ?) AS day_revenue,
        (SELECT ROUND(SUM(revenue) * 100) FROM transactions WHERE run_id = ?) AS sale_revenue`,
      [runId, runId]
    );
    const stock = await get(
      `SELECT COUNT(*) AS bad FROM daily_stock
       WHERE run_id = ? AND opening_qty + received_qty - sold_qty - expired_qty != closing_qty`,
      [runId]
    );
    const cash = await get(
      `SELECT
        (SELECT ROUND(opening_cash * 100) FROM sim_days WHERE run_id = ? AND day_number = 1) AS opening_cash,
        (SELECT ROUND(SUM(revenue) * 100) FROM sim_days WHERE run_id = ?) AS revenue,
        (SELECT ROUND(SUM(replenishment_spend) * 100) FROM sim_days WHERE run_id = ?) AS spend,
        (SELECT ROUND(closing_cash * 100) FROM sim_days WHERE run_id = ? AND day_number = 60) AS closing_cash`,
      [runId, runId, runId, runId]
    );

    console.log("submitted run", runId);
    console.log("products", counts.products);
    console.log("days", counts.days);
    console.log("stock rows", counts.stock_rows);
    console.log("transactions", counts.transactions);
    console.log("transaction lines", counts.lines);
    console.log("orders", counts.orders);
    console.log("events", counts.events);
    console.log("revenue check", revenue.day_revenue === revenue.sale_revenue ? "PASS" : "FAIL");
    console.log("stock check", stock.bad === 0 ? "PASS" : "FAIL");
    console.log(
      "cash check",
      cash.closing_cash === cash.opening_cash + cash.revenue - cash.spend ? "PASS" : "FAIL"
    );
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

saveRun()
  .then(() => db.close())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
