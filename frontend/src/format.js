export function money(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(value) || 0);
}

export function num(value) {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 }).format(Number(value) || 0);
}

export function productByName(products, name) {
  return products.find((product) => product.name === name);
}
