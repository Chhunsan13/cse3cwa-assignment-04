const { db } = require("./db");

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
  return {
    stock: stock.bad === 0 ? "PASS" : "FAIL",
    revenue: revenue.day_revenue === revenue.sale_revenue ? "PASS" : "FAIL",
    cash: cash.closing_cash === cash.opening_cash + cash.revenue - cash.spend ? "PASS" : "FAIL",
  };
}

async function reportPayload() {
  const run = await submittedRun();
  const id = run.id;
  const totals = await get(
    `SELECT
      SUM(customers) AS customers,
      SUM(transactions) AS transactions,
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
  const assurance = await assurancePayload(run);
  return {
    runId: id,
    startDate: run.start_date,
    dayCount: run.day_count,
    openingCash: run.opening_cash,
    inventoryBudget: run.inventory_budget,
    openingInventoryCost: run.opening_inventory_cost,
    ...totals,
    ...closing,
    assurance,
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
}

module.exports = { registerReportRoutes };
