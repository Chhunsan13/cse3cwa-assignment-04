const { db } = require("./db");

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function submittedRun() {
  const run = await get("SELECT * FROM runs WHERE is_submitted = 1");
  if (!run) {
    const error = new Error("No submitted run is stored");
    error.status = 404;
    throw error;
  }
  return run;
}

async function assurancePayload(run) {
  const id = run.id;
  const stock = await get(
    `SELECT COUNT(*) AS bad FROM daily_stock
     WHERE run_id = ? AND opening_qty + received_qty - sold_qty - expired_qty != closing_qty`,
    [id]
  );
  const negative = await get(
    "SELECT COUNT(*) AS bad FROM daily_stock WHERE run_id = ? AND closing_qty < 0",
    [id]
  );
  const revenue = await get(
    `SELECT
      ROUND(SUM(revenue) * 100) AS day_revenue,
      (SELECT ROUND(SUM(revenue) * 100) FROM transactions WHERE run_id = ?) AS sale_revenue
     FROM sim_days WHERE run_id = ?`,
    [id, id]
  );
  const cash = await get(
    `SELECT
      ROUND(opening_cash * 100) AS opening_cash,
      (SELECT ROUND(SUM(revenue) * 100) FROM sim_days WHERE run_id = ?) AS revenue,
      (SELECT ROUND(SUM(replenishment_spend) * 100) FROM sim_days WHERE run_id = ?) AS spend,
      (SELECT ROUND(closing_cash * 100) FROM sim_days WHERE run_id = ? AND day_number = 60) AS closing_cash
     FROM sim_days WHERE run_id = ? AND day_number = 1`,
    [id, id, id, id]
  );
  const overspent = await get(
    `SELECT COUNT(*) AS bad FROM replenishment_orders
     WHERE run_id = ? AND cost > cash_before + 0.001`,
    [id]
  );
  const counts = await get(
    `SELECT
      (SELECT COUNT(*) FROM sim_days WHERE run_id = ?) AS days,
      (SELECT COUNT(*) FROM products WHERE run_id = ?) AS products,
      (SELECT COUNT(*) FROM transactions WHERE run_id = ?) AS transactions,
      (SELECT COUNT(*) FROM transaction_lines WHERE run_id = ?) AS lines,
      (SELECT COUNT(*) FROM daily_stock WHERE run_id = ?) AS stock_rows,
      (SELECT COUNT(*) FROM replenishment_orders WHERE run_id = ?) AS orders,
      (SELECT COUNT(*) FROM brain_events WHERE run_id = ?) AS events`,
    [id, id, id, id, id, id, id]
  );
  const stockPass = stock.bad === 0 && negative.bad === 0;
  const revenuePass = revenue.day_revenue === revenue.sale_revenue;
  const cashPass = cash.closing_cash === cash.opening_cash + cash.revenue - cash.spend && overspent.bad === 0;
  return {
    stock: stockPass ? "PASS" : "FAIL",
    revenue: revenuePass ? "PASS" : "FAIL",
    cash: cashPass ? "PASS" : "FAIL",
    negativeStockRows: negative.bad,
    stockMismatches: stock.bad,
    ordersOverCash: overspent.bad,
    retained: counts,
  };
}

async function reportPayload() {
  const run = await submittedRun();
  const id = run.id;
  const totals = await get(
    `SELECT
      SUM(customers) AS customers,
      SUM(sim_days.transactions) AS transactions,
      SUM(units_sold) AS units_sold,
      ROUND(SUM(revenue), 2) AS revenue,
      ROUND(SUM(cogs), 2) AS cogs,
      ROUND(SUM(revenue - cogs), 2) AS gross_profit,
      SUM(expiry_units) AS expiry_units,
      ROUND(SUM(expiry_value), 2) AS expiry_value,
      SUM(replenishment_units) AS replenishment_units,
      ROUND(SUM(replenishment_spend), 2) AS replenishment_spend,
      SUM(lost_units) AS lost_units
     FROM sim_days WHERE run_id = ?`,
    [id]
  );
  const closing = await get(
    `SELECT ROUND(closing_cash, 2) AS closing_cash,
            ROUND(closing_inventory_value, 2) AS closing_inventory_value
     FROM sim_days WHERE run_id = ? AND day_number = 60`,
    [id]
  );
  const periods = await all(
    `SELECT CASE WHEN is_weekend = 1 THEN 'weekend' ELSE 'weekday' END AS period,
            COUNT(*) AS days,
            SUM(customers) AS customers,
            SUM(sim_days.transactions) AS transactions,
            SUM(units_sold) AS units_sold,
            ROUND(SUM(revenue), 2) AS revenue
     FROM sim_days WHERE run_id = ? GROUP BY is_weekend`,
    [id]
  );
  const categories = await all(
    `SELECT p.category,
            SUM(s.sold_qty) AS units,
            ROUND(SUM(s.revenue), 2) AS revenue,
            ROUND(SUM(s.revenue - s.cogs), 2) AS gross_profit,
            SUM(s.expired_qty) AS expired_units,
            SUM(s.lost_qty) AS lost_units
     FROM daily_stock s
     JOIN products p ON p.id = s.product_id
     WHERE s.run_id = ?
     GROUP BY p.category
     ORDER BY revenue DESC`,
    [id]
  );
  const products = await all(
    `SELECT p.sku, p.name, p.category,
            SUM(s.sold_qty) AS units,
            ROUND(SUM(s.revenue), 2) AS revenue,
            ROUND(SUM(s.revenue - s.cogs), 2) AS gross_profit,
            SUM(s.expired_qty) AS expired_units,
            SUM(s.lost_qty) AS lost_units,
            SUM(CASE WHEN s.day_number = 60 THEN s.closing_qty ELSE 0 END) AS closing_qty
     FROM daily_stock s
     JOIN products p ON p.id = s.product_id
     WHERE s.run_id = ?
     GROUP BY p.id
     ORDER BY revenue DESC`,
    [id]
  );
  const eventRows = await all(
    `SELECT event_type, COUNT(*) AS count, COALESCE(SUM(qty), 0) AS qty,
            ROUND(COALESCE(SUM(amount), 0), 2) AS amount
     FROM brain_events WHERE run_id = ? GROUP BY event_type`,
    [id]
  );
  const eventTypes = ["sold_out", "low_stock", "expiry", "slow_mover", "replenishment", "cash_constraint"];
  const events = Object.fromEntries(eventTypes.map((type) => [type, { count: 0, qty: 0, amount: 0 }]));
  for (const row of eventRows) events[row.event_type] = row;
  const slowMovers = await all(
    `SELECT p.name, e.day_number, e.qty, e.message, e.action
     FROM brain_events e
     JOIN products p ON p.id = e.product_id
     WHERE e.run_id = ? AND e.event_type = 'slow_mover'
     ORDER BY e.qty DESC`,
    [id]
  );
  const activity = await all(
    `SELECT day_number, sim_date, weekday, customers, sim_days.transactions AS transactions,
            units_sold, ROUND(revenue, 2) AS revenue
     FROM sim_days WHERE run_id = ? ORDER BY day_number`,
    [id]
  );
  const examples = await all(
    `SELECT p.name, e.day_number, e.event_type, e.message, e.action, e.qty, e.amount
     FROM brain_events e
     JOIN products p ON p.id = e.product_id
     WHERE e.run_id = ? AND p.sku IN ('P037', 'P038')
       AND e.event_type IN ('sold_out', 'expiry', 'replenishment')
     ORDER BY e.day_number, e.event_type
     LIMIT 8`,
    [id]
  );
  return {
    runId: id,
    startDate: run.start_date,
    dayCount: run.day_count,
    openingCash: run.opening_cash,
    inventoryBudget: run.inventory_budget,
    openingInventoryCost: run.opening_inventory_cost,
    config: JSON.parse(run.config_json),
    ...totals,
    ...closing,
    periods,
    categories,
    products,
    events,
    slowMovers,
    activity,
    examples,
    assurance: await assurancePayload(run),
  };
}

async function dayPayload(dayNumber) {
  const run = await submittedRun();
  const id = run.id;
  const day = await get(
    `SELECT day_number, sim_date, weekday, is_weekend, customers, sim_days.transactions AS transactions,
            units_sold, ROUND(revenue, 2) AS revenue, ROUND(cogs, 2) AS cogs,
            expiry_units, ROUND(expiry_value, 2) AS expiry_value,
            replenishment_units, ROUND(replenishment_spend, 2) AS replenishment_spend,
            ROUND(opening_cash, 2) AS opening_cash, ROUND(closing_cash, 2) AS closing_cash,
            ROUND(closing_inventory_value, 2) AS closing_inventory_value,
            lost_units, mission_json
     FROM sim_days WHERE run_id = ? AND day_number = ?`,
    [id, dayNumber]
  );
  if (!day) {
    const error = new Error("That day is not in the submitted run");
    error.status = 404;
    throw error;
  }
  const stock = await all(
    `SELECT p.sku, p.name, p.category, s.opening_qty, s.received_qty, s.sold_qty,
            s.expired_qty, s.closing_qty, s.lost_qty,
            ROUND(s.revenue, 2) AS revenue, ROUND(s.cogs, 2) AS cogs
     FROM daily_stock s
     JOIN products p ON p.id = s.product_id
     WHERE s.run_id = ? AND s.day_number = ?
     ORDER BY s.sold_qty DESC, p.name`,
    [id, dayNumber]
  );
  const orders = await all(
    `SELECT p.name, o.qty_requested, o.qty_ordered, ROUND(o.cost, 2) AS cost,
            ROUND(o.cash_before, 2) AS cash_before, o.constrained, o.reason, o.arrival_day
     FROM replenishment_orders o
     JOIN products p ON p.id = o.product_id
     WHERE o.run_id = ? AND o.order_day = ?
     ORDER BY o.cost DESC`,
    [id, dayNumber]
  );
  const events = await all(
    `SELECT p.name, e.event_type, e.message, e.action, e.qty, e.amount
     FROM brain_events e
     LEFT JOIN products p ON p.id = e.product_id
     WHERE e.run_id = ? AND e.day_number = ?
     ORDER BY e.id`,
    [id, dayNumber]
  );
  const transactions = await all(
    `SELECT t.id, t.mission, t.units, ROUND(t.revenue, 2) AS revenue, ROUND(t.cogs, 2) AS cogs
     FROM transactions t
     WHERE t.run_id = ? AND t.day_number = ?
     ORDER BY t.id`,
    [id, dayNumber]
  );
  return {
    runId: id,
    ...day,
    missions: JSON.parse(day.mission_json),
    stock,
    orders,
    events,
    sales: transactions,
  };
}

function registerReportRoutes(app) {
  app.get("/api/run", async (req, res) => {
    try {
      res.json(await reportPayload());
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.get("/api/run/days/:dayNumber", async (req, res) => {
    const dayNumber = Number(req.params.dayNumber);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 60) {
      res.status(400).json({ error: "Day must be from 1 to 60" });
      return;
    }
    try {
      res.json(await dayPayload(dayNumber));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });
}

module.exports = { registerReportRoutes };
