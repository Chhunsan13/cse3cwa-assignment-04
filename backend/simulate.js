const { PRODUCTS, OPENING_CASH } = require("./catalogue");
const { buildDay, fulfillBasket } = require("./customers");
const { reviewDay } = require("./brain");

const DAY_COUNT = 60;
const REORDER_COVER_DAYS = 2;
const TARGET_COVER_DAYS = 7;

function cents(amount) {
  return Math.round(amount * 100);
}

function dollars(centsValue) {
  return (centsValue / 100).toFixed(2);
}

function stockMap(batches) {
  const stock = {};
  for (const batch of batches) {
    if (batch.qty <= 0) continue;
    stock[batch.sku] = (stock[batch.sku] || 0) + batch.qty;
  }
  return stock;
}

function inventoryValueCents(batches) {
  return batches.reduce((sum, batch) => sum + batch.qty * cents(batch.unitCost), 0);
}

function openingBatches() {
  return PRODUCTS.map((product) => ({
    sku: product.sku,
    qty: product.initialQty,
    unitCost: product.unitCost,
    expiryDay: product.perishable ? 1 + product.shelfLifeDays : null,
  }));
}

function receiveOrders(batches, orders, dayNumber) {
  const products = Object.fromEntries(PRODUCTS.map((product) => [product.sku, product]));
  const received = {};
  for (const order of orders) {
    if (order.arrivalDay !== dayNumber || order.qtyOrdered <= 0) continue;
    const product = products[order.sku];
    batches.push({
      sku: order.sku,
      qty: order.qtyOrdered,
      unitCost: product.unitCost,
      expiryDay: product.perishable ? dayNumber + product.shelfLifeDays : null,
    });
    received[order.sku] = (received[order.sku] || 0) + order.qtyOrdered;
  }
  return received;
}

function expireStock(batches, dayNumber) {
  const expired = {};
  let valueCents = 0;
  const kept = [];
  for (const batch of batches) {
    const isExpired = batch.expiryDay !== null && batch.expiryDay <= dayNumber && batch.qty > 0;
    if (isExpired) {
      expired[batch.sku] = (expired[batch.sku] || 0) + batch.qty;
      valueCents += batch.qty * cents(batch.unitCost);
    } else if (batch.qty > 0) {
      kept.push(batch);
    }
  }
  return { batches: kept, expired, valueCents };
}

function takeFromBatches(batches, sku, qty) {
  const ordered = batches
    .filter((batch) => batch.sku === sku && batch.qty > 0)
    .sort((left, right) => {
      if (left.expiryDay === null) return 1;
      if (right.expiryDay === null) return -1;
      return left.expiryDay - right.expiryDay;
    });
  let need = qty;
  let cogsCents = 0;
  for (const batch of ordered) {
    if (need === 0) break;
    const take = Math.min(batch.qty, need);
    batch.qty -= take;
    need -= take;
    cogsCents += take * cents(batch.unitCost);
  }
  return { taken: qty - need, cogsCents };
}

function placeOrders(batches, cashCents, dayNumber) {
  if (dayNumber >= DAY_COUNT) return { orders: [], cashCents };
  const stock = stockMap(batches);
  const orders = [];
  for (const product of PRODUCTS) {
    const onHand = stock[product.sku] || 0;
    const reorderPoint = Math.max(1, Math.ceil(product.priorDaily * REORDER_COVER_DAYS));
    if (onHand >= reorderPoint) continue;
    const coverDays = product.perishable
      ? Math.min(product.shelfLifeDays, TARGET_COVER_DAYS)
      : TARGET_COVER_DAYS;
    const target = Math.max(reorderPoint, Math.ceil(product.priorDaily * coverDays));
    const qtyRequested = Math.max(0, target - onHand);
    if (qtyRequested === 0) continue;
    const unitCents = cents(product.unitCost);
    const affordable = unitCents === 0 ? 0 : Math.floor(cashCents / unitCents);
    const qtyOrdered = Math.min(qtyRequested, affordable);
    const costCents = qtyOrdered * unitCents;
    const cashBeforeCents = cashCents;
    cashCents -= costCents;
    orders.push({
      sku: product.sku,
      orderDay: dayNumber,
      arrivalDay: dayNumber + 1,
      qtyRequested,
      qtyOrdered,
      costCents,
      cashBeforeCents,
      constrained: qtyOrdered < qtyRequested ? 1 : 0,
      reason: onHand === 0 ? "sold_out" : "low_stock",
    });
  }
  return { orders, cashCents };
}

function runSimulation() {
  let batches = openingBatches();
  let cashCents = cents(OPENING_CASH);
  let dueOrders = [];
  const days = [];
  const events = [];
  const soldToDate = {};
  const seenSlow = new Set();
  let stockOk = true;

  for (let dayNumber = 1; dayNumber <= DAY_COUNT; dayNumber += 1) {
    const opening = stockMap(batches);
    const openingCashCents = cashCents;
    const received = receiveOrders(batches, dueOrders, dayNumber);
    const expired = expireStock(batches, dayNumber);
    batches = expired.batches;

    const demand = buildDay(dayNumber);
    const stock = stockMap(batches);
    const products = Object.fromEntries(PRODUCTS.map((product) => [product.sku, product]));
    const sold = {};
    const lost = {};
    const revenueBySku = {};
    const cogsBySku = {};
    const dayTransactions = [];
    const missionCounts = {};
    let transactions = 0;
    let revenueCents = 0;
    let cogsCents = 0;
    let lostUnits = 0;

    for (const basket of demand.baskets) {
      missionCounts[basket.mission] = (missionCounts[basket.mission] || 0) + 1;
      const result = fulfillBasket(basket.lines, stock);
      lostUnits += result.lostUnits;
      for (const line of basket.lines) {
        const soldLine = result.sold.find((item) => item.sku === line.sku);
        const soldQty = soldLine ? soldLine.qty : 0;
        const missed = line.qty - soldQty;
        if (missed > 0) lost[line.sku] = (lost[line.sku] || 0) + missed;
      }
      if (result.sold.length === 0) continue;
      transactions += 1;
      const savedLines = [];
      let basketUnits = 0;
      let basketRevenue = 0;
      let basketCogs = 0;
      for (const line of result.sold) {
        const product = products[line.sku];
        const taken = takeFromBatches(batches, line.sku, line.qty);
        if (taken.taken !== line.qty) stockOk = false;
        const lineRevenue = line.qty * cents(product.unitPrice);
        sold[line.sku] = (sold[line.sku] || 0) + line.qty;
        soldToDate[line.sku] = (soldToDate[line.sku] || 0) + line.qty;
        revenueBySku[line.sku] = (revenueBySku[line.sku] || 0) + lineRevenue;
        cogsBySku[line.sku] = (cogsBySku[line.sku] || 0) + taken.cogsCents;
        revenueCents += lineRevenue;
        cogsCents += taken.cogsCents;
        basketUnits += line.qty;
        basketRevenue += lineRevenue;
        basketCogs += taken.cogsCents;
        savedLines.push({
          sku: line.sku,
          qty: line.qty,
          unitPriceCents: cents(product.unitPrice),
          unitCostCents: cents(product.unitCost),
          revenueCents: lineRevenue,
          cogsCents: taken.cogsCents,
        });
      }
      dayTransactions.push({
        mission: basket.mission,
        units: basketUnits,
        revenueCents: basketRevenue,
        cogsCents: basketCogs,
        lines: savedLines,
      });
    }

    const closing = stockMap(batches);
    for (const product of PRODUCTS) {
      const expected =
        (opening[product.sku] || 0) +
        (received[product.sku] || 0) -
        (sold[product.sku] || 0) -
        (expired.expired[product.sku] || 0);
      if (expected !== (closing[product.sku] || 0)) stockOk = false;
    }

    cashCents += revenueCents;
    const ordered = placeOrders(batches, cashCents, dayNumber);
    cashCents = ordered.cashCents;
    dueOrders = ordered.orders;
    events.push(
      ...reviewDay({
        dayNumber,
        closing,
        expired: expired.expired,
        soldToDate,
        orders: ordered.orders,
        seenSlow,
      })
    );

    days.push({
      dayNumber,
      date: demand.date,
      weekday: demand.weekday,
      customers: demand.customers,
      transactions,
      unitsSold: Object.values(sold).reduce((sum, qty) => sum + qty, 0),
      revenueCents,
      cogsCents,
      expiryUnits: Object.values(expired.expired).reduce((sum, qty) => sum + qty, 0),
      expiryValueCents: expired.valueCents,
      replenishmentUnits: ordered.orders.reduce((sum, order) => sum + order.qtyOrdered, 0),
      replenishmentCents: ordered.orders.reduce((sum, order) => sum + order.costCents, 0),
      openingCashCents,
      closingCashCents: cashCents,
      closingInventoryCents: inventoryValueCents(batches),
      lostUnits,
      constrainedOrders: ordered.orders.filter((order) => order.constrained).length,
      missionCounts,
      stock: PRODUCTS.map((product) => ({
        sku: product.sku,
        openingQty: opening[product.sku] || 0,
        receivedQty: received[product.sku] || 0,
        soldQty: sold[product.sku] || 0,
        expiredQty: expired.expired[product.sku] || 0,
        closingQty: closing[product.sku] || 0,
        lostQty: lost[product.sku] || 0,
        revenueCents: revenueBySku[product.sku] || 0,
        cogsCents: cogsBySku[product.sku] || 0,
      })),
      sales: dayTransactions,
      orders: ordered.orders,
    });
  }

  return { days, cashCents, stockOk, events };
}

if (require.main === module) {
  const result = runSimulation();
  const totals = result.days.reduce(
    (sum, day) => {
      sum.customers += day.customers;
      sum.transactions += day.transactions;
      sum.units += day.unitsSold;
      sum.revenue += day.revenueCents;
      sum.cogs += day.cogsCents;
      sum.expiryUnits += day.expiryUnits;
      sum.expiryValue += day.expiryValueCents;
      sum.replenish += day.replenishmentCents;
      sum.lost += day.lostUnits;
      sum.constrained += day.constrainedOrders;
      return sum;
    },
    {
      customers: 0,
      transactions: 0,
      units: 0,
      revenue: 0,
      cogs: 0,
      expiryUnits: 0,
      expiryValue: 0,
      replenish: 0,
      lost: 0,
      constrained: 0,
    }
  );
  const closingCash = result.days[result.days.length - 1].closingCashCents;
  const expectedCash = cents(OPENING_CASH) + totals.revenue - totals.replenish;
  const lowCash = placeOrders([], 100, 1);
  const lowCashOrdered = lowCash.orders.reduce((sum, order) => sum + order.qtyOrdered, 0);
  const lowCashCut = lowCash.orders.filter((order) => order.constrained).length;
  const types = {};
  for (const event of result.events) types[event.eventType] = (types[event.eventType] || 0) + 1;
  console.log("events", JSON.stringify(types));
  console.log("days", result.days.length);
  console.log("customers", totals.customers);
  console.log("transactions", totals.transactions);
  console.log("units", totals.units);
  console.log("revenue", dollars(totals.revenue));
  console.log("cogs", dollars(totals.cogs));
  console.log("expiry units", totals.expiryUnits);
  console.log("expiry value", dollars(totals.expiryValue));
  console.log("replenishment", dollars(totals.replenish));
  console.log("lost units", totals.lost);
  console.log("constrained orders", totals.constrained);
  console.log("closing cash", dollars(closingCash));
  console.log("day 60 orders", result.days[59].replenishmentUnits);
  console.log("cash check", closingCash === expectedCash ? "PASS" : "FAIL");
  console.log("stock check", result.stockOk ? "PASS" : "FAIL");
  console.log("low cash ordered", lowCashOrdered, "constrained", lowCashCut);
}

module.exports = { DAY_COUNT, runSimulation, placeOrders };