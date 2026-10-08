const INVENTORY_BUDGET = 40000;
const OPENING_CASH = 15000;

// priorDaily is the assumed average units sold per day before stock limits.
// Opening stock for pantry goods covers many weeks. Fresh and ready meals
// cover only a few days, because those lines expire.
const PRODUCTS = [
  { sku: "P001", name: "Jasmine rice 1kg", category: "Grocery", unitCost: 2.2, unitPrice: 3.5, initialQty: 1600, perishable: 0, shelfLifeDays: null, priorDaily: 4.0 },
  { sku: "P002", name: "Spaghetti 500g", category: "Grocery", unitCost: 1.3, unitPrice: 2.2, initialQty: 1120, perishable: 0, shelfLifeDays: null, priorDaily: 3.2 },
  { sku: "P003", name: "Canned tomatoes 400g", category: "Grocery", unitCost: 1.05, unitPrice: 1.9, initialQty: 960, perishable: 0, shelfLifeDays: null, priorDaily: 2.4 },
  { sku: "P004", name: "Baked beans 420g", category: "Grocery", unitCost: 1.15, unitPrice: 2.1, initialQty: 700, perishable: 0, shelfLifeDays: null, priorDaily: 2.0 },
  { sku: "P005", name: "Pasta sauce 500g", category: "Grocery", unitCost: 1.7, unitPrice: 3.2, initialQty: 540, perishable: 0, shelfLifeDays: null, priorDaily: 1.8 },
  { sku: "P006", name: "Breakfast cereal 550g", category: "Grocery", unitCost: 3.2, unitPrice: 5.8, initialQty: 448, perishable: 0, shelfLifeDays: null, priorDaily: 1.6 },
  { sku: "P007", name: "Rolled oats 750g", category: "Grocery", unitCost: 2.0, unitPrice: 3.9, initialQty: 360, perishable: 0, shelfLifeDays: null, priorDaily: 1.2 },
  { sku: "P008", name: "Instant noodles 5 pack", category: "Grocery", unitCost: 1.9, unitPrice: 3.8, initialQty: 630, perishable: 0, shelfLifeDays: null, priorDaily: 3.5 },
  { sku: "P009", name: "Olive oil 500ml", category: "Grocery", unitCost: 6.4, unitPrice: 11.5, initialQty: 400, perishable: 0, shelfLifeDays: null, priorDaily: 0.5 },
  { sku: "P010", name: "Long-life milk 1L", category: "Grocery", unitCost: 1.45, unitPrice: 2.6, initialQty: 600, perishable: 0, shelfLifeDays: null, priorDaily: 3.0 },
  { sku: "P011", name: "Still water 600ml", category: "Drinks", unitCost: 0.65, unitPrice: 2.4, initialQty: 1440, perishable: 0, shelfLifeDays: null, priorDaily: 12.0 },
  { sku: "P012", name: "Sparkling water 1.25L", category: "Drinks", unitCost: 1.1, unitPrice: 3.2, initialQty: 625, perishable: 0, shelfLifeDays: null, priorDaily: 2.5 },
  { sku: "P013", name: "Cola 1.25L", category: "Drinks", unitCost: 1.6, unitPrice: 3.8, initialQty: 700, perishable: 0, shelfLifeDays: null, priorDaily: 5.0 },
  { sku: "P014", name: "Orange juice 2L", category: "Drinks", unitCost: 3.4, unitPrice: 5.8, initialQty: 26, perishable: 1, shelfLifeDays: 21, priorDaily: 2.2 },
  { sku: "P015", name: "Iced coffee 500ml", category: "Drinks", unitCost: 2.1, unitPrice: 4.5, initialQty: 24, perishable: 1, shelfLifeDays: 14, priorDaily: 3.0 },
  { sku: "P016", name: "Sports drink 600ml", category: "Drinks", unitCost: 1.8, unitPrice: 3.9, initialQty: 400, perishable: 0, shelfLifeDays: null, priorDaily: 2.0 },
  { sku: "P017", name: "Potato chips 175g", category: "Snacks", unitCost: 2.2, unitPrice: 4.5, initialQty: 640, perishable: 0, shelfLifeDays: null, priorDaily: 4.0 },
  { sku: "P018", name: "Corn chips 200g", category: "Snacks", unitCost: 2.4, unitPrice: 4.8, initialQty: 396, perishable: 0, shelfLifeDays: null, priorDaily: 1.8 },
  { sku: "P019", name: "Chocolate bar 50g", category: "Snacks", unitCost: 1.2, unitPrice: 2.8, initialQty: 840, perishable: 0, shelfLifeDays: null, priorDaily: 6.0 },
  { sku: "P020", name: "Mixed nuts 150g", category: "Snacks", unitCost: 3.5, unitPrice: 6.5, initialQty: 480, perishable: 0, shelfLifeDays: null, priorDaily: 0.8 },
  { sku: "P021", name: "Muesli bar 6 pack", category: "Snacks", unitCost: 3.8, unitPrice: 6.9, initialQty: 400, perishable: 0, shelfLifeDays: null, priorDaily: 1.6 },
  { sku: "P022", name: "Rice crackers 100g", category: "Snacks", unitCost: 1.6, unitPrice: 3.4, initialQty: 392, perishable: 0, shelfLifeDays: null, priorDaily: 1.4 },
  { sku: "P023", name: "Full cream milk 2L", category: "Dairy", unitCost: 2.4, unitPrice: 3.9, initialQty: 64, perishable: 1, shelfLifeDays: 10, priorDaily: 8.0 },
  { sku: "P024", name: "Greek yoghurt 1kg", category: "Dairy", unitCost: 4.2, unitPrice: 7.5, initialQty: 22, perishable: 1, shelfLifeDays: 14, priorDaily: 2.2 },
  { sku: "P025", name: "Cheddar 500g", category: "Dairy", unitCost: 6.5, unitPrice: 11.0, initialQty: 17, perishable: 1, shelfLifeDays: 21, priorDaily: 1.2 },
  { sku: "P026", name: "Butter 250g", category: "Dairy", unitCost: 3.8, unitPrice: 6.2, initialQty: 25, perishable: 1, shelfLifeDays: 30, priorDaily: 1.4 },
  { sku: "P027", name: "Eggs 12 pack", category: "Dairy", unitCost: 4.5, unitPrice: 7.8, initialQty: 36, perishable: 1, shelfLifeDays: 18, priorDaily: 3.0 },
  { sku: "P028", name: "Cream 300ml", category: "Dairy", unitCost: 2.6, unitPrice: 4.4, initialQty: 8, perishable: 1, shelfLifeDays: 12, priorDaily: 0.8 },
  { sku: "P029", name: "Bananas 1kg", category: "Fresh", unitCost: 2.8, unitPrice: 4.9, initialQty: 20, perishable: 1, shelfLifeDays: 5, priorDaily: 5.0 },
  { sku: "P030", name: "Apples 1kg", category: "Fresh", unitCost: 3.2, unitPrice: 5.5, initialQty: 22, perishable: 1, shelfLifeDays: 10, priorDaily: 2.8 },
  { sku: "P031", name: "Baby spinach 120g", category: "Fresh", unitCost: 2.4, unitPrice: 4.2, initialQty: 6, perishable: 1, shelfLifeDays: 4, priorDaily: 2.0 },
  { sku: "P032", name: "Tomatoes 500g", category: "Fresh", unitCost: 2.9, unitPrice: 4.8, initialQty: 12, perishable: 1, shelfLifeDays: 6, priorDaily: 2.4 },
  { sku: "P033", name: "White bread loaf", category: "Fresh", unitCost: 1.8, unitPrice: 3.6, initialQty: 21, perishable: 1, shelfLifeDays: 4, priorDaily: 7.0 },
  { sku: "P034", name: "Croissant 2 pack", category: "Fresh", unitCost: 2.5, unitPrice: 5.5, initialQty: 4, perishable: 1, shelfLifeDays: 2, priorDaily: 2.0 },
  { sku: "P035", name: "Chicken breast 500g", category: "Fresh", unitCost: 6.8, unitPrice: 12.5, initialQty: 7, perishable: 1, shelfLifeDays: 4, priorDaily: 2.2 },
  { sku: "P036", name: "Beef mince 500g", category: "Fresh", unitCost: 7.2, unitPrice: 13.0, initialQty: 4, perishable: 1, shelfLifeDays: 3, priorDaily: 1.4 },
  { sku: "P037", name: "Chicken sandwich", category: "Ready meals", unitCost: 3.2, unitPrice: 7.9, initialQty: 12, perishable: 1, shelfLifeDays: 2, priorDaily: 6.0 },
  { sku: "P038", name: "Sushi pack", category: "Ready meals", unitCost: 4.5, unitPrice: 11.5, initialQty: 3, perishable: 1, shelfLifeDays: 1, priorDaily: 3.0 },
  { sku: "P039", name: "Microwave pasta", category: "Ready meals", unitCost: 3.8, unitPrice: 7.5, initialQty: 10, perishable: 1, shelfLifeDays: 6, priorDaily: 2.0 },
  { sku: "P040", name: "Instant soup cup", category: "Ready meals", unitCost: 1.4, unitPrice: 3.2, initialQty: 500, perishable: 0, shelfLifeDays: null, priorDaily: 2.5 },
  { sku: "P041", name: "Toilet paper 12 pack", category: "Household", unitCost: 7.5, unitPrice: 12.0, initialQty: 420, perishable: 0, shelfLifeDays: null, priorDaily: 0.6 },
  { sku: "P042", name: "Paper towels 2 pack", category: "Household", unitCost: 4.2, unitPrice: 7.5, initialQty: 240, perishable: 0, shelfLifeDays: null, priorDaily: 0.4 },
  { sku: "P043", name: "Dishwashing liquid 500ml", category: "Household", unitCost: 2.8, unitPrice: 5.2, initialQty: 250, perishable: 0, shelfLifeDays: null, priorDaily: 0.5 },
  { sku: "P044", name: "Laundry powder 1kg", category: "Household", unitCost: 6.8, unitPrice: 11.5, initialQty: 240, perishable: 0, shelfLifeDays: null, priorDaily: 0.3 },
  { sku: "P045", name: "Bin bags 20 pack", category: "Household", unitCost: 3.2, unitPrice: 5.8, initialQty: 200, perishable: 0, shelfLifeDays: null, priorDaily: 0.4 },
  { sku: "P046", name: "Hand soap 250ml", category: "Personal", unitCost: 2.4, unitPrice: 4.8, initialQty: 270, perishable: 0, shelfLifeDays: null, priorDaily: 0.6 },
  { sku: "P047", name: "Toothpaste 110g", category: "Personal", unitCost: 2.8, unitPrice: 5.5, initialQty: 250, perishable: 0, shelfLifeDays: null, priorDaily: 0.5 },
  { sku: "P048", name: "Shampoo 350ml", category: "Personal", unitCost: 4.6, unitPrice: 8.5, initialQty: 245, perishable: 0, shelfLifeDays: null, priorDaily: 0.35 },
];

function openingCost(products) {
  return products.reduce((sum, product) => sum + product.unitCost * product.initialQty, 0);
}

if (require.main === module) {
  const total = openingCost(PRODUCTS);
  console.log("products", PRODUCTS.length);
  console.log("opening inventory cost", total.toFixed(2));
  console.log("budget", INVENTORY_BUDGET.toFixed(2));
  console.log("unused budget", (INVENTORY_BUDGET - total).toFixed(2));
  console.log(total <= INVENTORY_BUDGET ? "PASS" : "FAIL");
}

module.exports = { PRODUCTS, INVENTORY_BUDGET, OPENING_CASH, openingCost };