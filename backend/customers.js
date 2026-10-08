const { PRODUCTS } = require("./catalogue");

// Day 1 is Monday 3 August 2026. The same seed always rebuilds the same day.
const START_DATE = "2026-08-03";
const SEED = 20260803;

// A small CBD store: Friday is the busiest office day, Sunday is the quietest.
const CUSTOMERS_BY_WEEKDAY = {
  Monday: 80,
  Tuesday: 85,
  Wednesday: 90,
  Thursday: 95,
  Friday: 120,
  Saturday: 70,
  Sunday: 40,
};

// Shares are the chance a customer has that mission. Weekday and weekend differ.
const MISSIONS = [
  {
    name: "office_lunch",
    weekdayShare: 0.4,
    weekendShare: 0.05,
    minItems: 1,
    maxItems: 3,
    categories: { "Ready meals": 0.45, Drinks: 0.3, Snacks: 0.2, Fresh: 0.05 },
  },
  {
    name: "commute_topup",
    weekdayShare: 0.3,
    weekendShare: 0.15,
    minItems: 1,
    maxItems: 4,
    categories: { Drinks: 0.35, Snacks: 0.25, Dairy: 0.2, "Ready meals": 0.15, Personal: 0.05 },
  },
  {
    name: "household_shop",
    weekdayShare: 0.15,
    weekendShare: 0.5,
    minItems: 4,
    maxItems: 9,
    categories: { Grocery: 0.45, Household: 0.2, Personal: 0.1, Dairy: 0.15, Snacks: 0.1 },
  },
  {
    name: "fresh_topup",
    weekdayShare: 0.15,
    weekendShare: 0.3,
    minItems: 2,
    maxItems: 5,
    categories: { Fresh: 0.55, Dairy: 0.25, Grocery: 0.15, "Ready meals": 0.05 },
  },
];

function mulberry32(seed) {
  let state = seed >>> 0;
  return function rand() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateForDay(dayNumber) {
  const date = new Date(`${START_DATE}T00:00:00`);
  date.setDate(date.getDate() + dayNumber - 1);
  return date;
}

function weekdayName(date) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
}

function pickWeighted(rand, items, weightOf) {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let mark = rand() * total;
  for (const item of items) {
    mark -= weightOf(item);
    if (mark <= 0) return item;
  }
  return items[items.length - 1];
}

function intendedBasket(rand, mission) {
  const size = mission.minItems + Math.floor(rand() * (mission.maxItems - mission.minItems + 1));
  const lines = [];
  const categoryNames = Object.keys(mission.categories);
  for (let i = 0; i < size; i += 1) {
    const category = pickWeighted(rand, categoryNames, (name) => mission.categories[name]);
    const choices = PRODUCTS.filter((product) => product.category === category);
    const product = pickWeighted(rand, choices, (item) => item.priorDaily);
    const extra =
      mission.name === "household_shop" && product.category === "Grocery" && rand() < 0.3 ? 2 : 1;
    const existing = lines.find((line) => line.sku === product.sku);
    if (existing) existing.qty += extra;
    else {
      lines.push({
        sku: product.sku,
        name: product.name,
        category: product.category,
        qty: extra,
      });
    }
  }
  return lines;
}

function buildDay(dayNumber, seed = SEED) {
  const date = dateForDay(dayNumber);
  const weekday = weekdayName(date);
  const weekend = weekday === "Saturday" || weekday === "Sunday";
  const rand = mulberry32(seed + dayNumber * 1000);
  const customerCount = CUSTOMERS_BY_WEEKDAY[weekday];
  const baskets = [];
  for (let i = 0; i < customerCount; i += 1) {
    const mission = pickWeighted(rand, MISSIONS, (item) =>
      weekend ? item.weekendShare : item.weekdayShare
    );
    baskets.push({
      customer: i + 1,
      mission: mission.name,
      lines: intendedBasket(rand, mission),
    });
  }
  return {
    dayNumber,
    date: formatDate(date),
    weekday,
    customers: customerCount,
    baskets,
  };
}

// Caps each line at the units still on the shelf. Missing stock is lost demand.
function fulfillBasket(lines, stockBySku) {
  const sold = [];
  let lostUnits = 0;
  for (const line of lines) {
    const available = stockBySku[line.sku] || 0;
    const qty = Math.min(line.qty, available);
    lostUnits += line.qty - qty;
    if (qty > 0) {
      sold.push({ ...line, qty });
      stockBySku[line.sku] = available - qty;
    }
  }
  return { sold, lostUnits };
}

function summarise(day) {
  const missions = {};
  let units = 0;
  for (const basket of day.baskets) {
    missions[basket.mission] = (missions[basket.mission] || 0) + 1;
    for (const line of basket.lines) units += line.qty;
  }
  return { missions, units };
}

if (require.main === module) {
  const monday = summarise(buildDay(1));
  const friday = summarise(buildDay(5));
  const sunday = summarise(buildDay(7));
  const mondayDay = buildDay(1);
  console.log("Monday", mondayDay.date, mondayDay.weekday, "customers", mondayDay.customers, "units", monday.units);
  console.log("missions", JSON.stringify(monday.missions));
  const fridayDay = buildDay(5);
  console.log("Friday", fridayDay.date, fridayDay.weekday, "customers", fridayDay.customers, "units", friday.units);
  console.log("missions", JSON.stringify(friday.missions));
  const sundayDay = buildDay(7);
  console.log("Sunday", sundayDay.date, sundayDay.weekday, "customers", sundayDay.customers, "units", sunday.units);
  console.log("missions", JSON.stringify(sunday.missions));

  const stock = { P011: 0 };
  const blocked = fulfillBasket(
    [{ sku: "P011", name: "Still water 600ml", category: "Drinks", qty: 2 }],
    stock
  );
  console.log("sold out water sold", blocked.sold.length, "lost", blocked.lostUnits);
}

module.exports = {
  START_DATE,
  SEED,
  CUSTOMERS_BY_WEEKDAY,
  MISSIONS,
  buildDay,
  fulfillBasket,
};