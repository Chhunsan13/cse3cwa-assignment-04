const { PRODUCTS } = require("./catalogue");

const REORDER_COVER_DAYS = 2;
const SLOW_AFTER_DAY = 14;

function cents(amount) {
  return Math.round(amount * 100);
}

function productBySku(sku) {
  return PRODUCTS.find((product) => product.sku === sku);
}

function reviewDay({ dayNumber, closing, expired, soldToDate, orders, seenSlow }) {
  const events = [];

  for (const product of PRODUCTS) {
    const onHand = closing[product.sku] || 0;
    const reorderPoint = Math.max(1, Math.ceil(product.priorDaily * REORDER_COVER_DAYS));
    const expiredQty = expired[product.sku] || 0;

    if (expiredQty > 0) {
      events.push({
        dayNumber,
        sku: product.sku,
        eventType: "expiry",
        message: `${product.name} expired and was removed from sale`,
        action: "write_off",
        qty: expiredQty,
        amountCents: expiredQty * cents(product.unitCost),
      });
    }

    if (onHand === 0) {
      events.push({
        dayNumber,
        sku: product.sku,
        eventType: "sold_out",
        message: `${product.name} has no units left for sale`,
        action: "reorder_if_cash",
        qty: 0,
        amountCents: null,
      });
    } else if (onHand < reorderPoint) {
      events.push({
        dayNumber,
        sku: product.sku,
        eventType: "low_stock",
        message: `${product.name} is below ${reorderPoint} units`,
        action: "reorder",
        qty: onHand,
        amountCents: null,
      });
    }

    const soldUnits = soldToDate[product.sku] || 0;
    const dailyRate = soldUnits / dayNumber;
    const coverDays = dailyRate <= 0 ? Infinity : onHand / dailyRate;
    const slow = dayNumber >= SLOW_AFTER_DAY && onHand >= 20 && coverDays > 45;
    if (slow && !seenSlow.has(product.sku)) {
      seenSlow.add(product.sku);
      events.push({
        dayNumber,
        sku: product.sku,
        eventType: "slow_mover",
        message: `${product.name} still has ${onHand} units but sales are far below that stock`,
        action: "do_not_reorder",
        qty: onHand,
        amountCents: null,
      });
    }
  }

  for (const order of orders) {
    const product = productBySku(order.sku);
    if (order.qtyOrdered > 0) {
      events.push({
        dayNumber,
        sku: order.sku,
        eventType: "replenishment",
        message: `Ordered ${order.qtyOrdered} of ${product.name} for the next morning`,
        action: "order",
        qty: order.qtyOrdered,
        amountCents: order.costCents,
      });
    }
    if (order.constrained) {
      events.push({
        dayNumber,
        sku: order.sku,
        eventType: "cash_constraint",
        message: `Cash cut ${product.name} from ${order.qtyRequested} requested to ${order.qtyOrdered} ordered`,
        action: "cut_order",
        qty: order.qtyRequested - order.qtyOrdered,
        amountCents: order.costCents,
      });
    }
  }

  return events;
}

if (require.main === module) {
  const seenSlow = new Set();
  const closing = {};
  const soldToDate = {};
  for (const product of PRODUCTS) {
    closing[product.sku] = Math.ceil(product.priorDaily * 10);
    soldToDate[product.sku] = Math.ceil(product.priorDaily * 14);
  }
  closing.P009 = 390;
  closing.P038 = 0;
  closing.P033 = 2;
  soldToDate.P009 = 1;
  const events = reviewDay({
    dayNumber: 14,
    closing,
    expired: { P038: 3 },
    soldToDate,
    orders: [
      {
        sku: "P038",
        qtyRequested: 3,
        qtyOrdered: 0,
        costCents: 0,
        constrained: 1,
      },
      {
        sku: "P033",
        qtyRequested: 20,
        qtyOrdered: 20,
        costCents: 3600,
        constrained: 0,
      },
    ],
    seenSlow,
  });
  const types = {};
  for (const event of events) types[event.eventType] = (types[event.eventType] || 0) + 1;
  console.log(JSON.stringify(types));
  console.log("slow flagged once", seenSlow.has("P009"));
}

module.exports = { reviewDay };