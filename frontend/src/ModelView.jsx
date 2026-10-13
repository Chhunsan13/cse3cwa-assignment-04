export default function ModelView({ report }) {
  const config = report.config;
  return (
    <section>
      <h2>Model declaration</h2>
      <p>
        Run {report.runId} is frozen. These are the assumptions that produced it. They are a prototype for a
        small CBD supermarket, not a forecast from measured Swanston Street traffic.
      </p>
      <h3>Customers</h3>
      <p>
        Day 1 is Monday {report.startDate}. The same seed ({config.seed}) rebuilds the same shoppers. A weekday
        is busier than Sunday, and Friday is the busiest day.
      </p>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Customers</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(config.customersByWeekday).map(([day, count]) => (
            <tr key={day}>
              <td>{day}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Shopping</h3>
      <p>Each customer has one mission. The mission sets the basket size and which categories they look for. Inside a category, a product is more likely to be chosen when its assumed daily demand is higher.</p>
      <table>
        <thead>
          <tr>
            <th>Mission</th>
            <th>Weekday share</th>
            <th>Weekend share</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          {config.missions.map((mission) => (
            <tr key={mission.name}>
              <td>{mission.name.replaceAll("_", " ")}</td>
              <td>{mission.weekdayShare}</td>
              <td>{mission.weekendShare}</td>
              <td>
                {mission.minItems}–{mission.maxItems}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Expiry</h3>
      <p>
        Perishable stock is kept in batches. Opening stock is treated as arriving on day 1 and expires on the
        morning of day 1 plus its shelf life. A later delivery expires on the morning of its arrival day plus
        its shelf life. Each morning the store receives yesterday’s order, then throws out batches that have
        reached expiry, then serves customers. The oldest batch is sold first. Expired units cannot be sold.
      </p>
      <h3>Store Brain</h3>
      <ul>
        <li>After sales, a product with nothing left is sold out. A product below {config.reorderCoverDays} days of assumed demand is low stock.</li>
        <li>The brain orders enough to cover {config.targetCoverDays} days, or the shelf life when that is shorter. The order is paid from operating cash immediately and arrives the next morning.</li>
        <li>If cash cannot pay for the full order, the quantity is cut and the shortfall is recorded as a cash constraint. No order is placed after day 60.</li>
        <li>
          From day {config.slowMoverAfterDay}, a line with at least 20 units and more than {config.slowMoverCoverDays} days of cover is flagged once as a slow mover. The action is not to reorder it for that reason.
        </li>
      </ul>
      <p>
        Opening inventory cost {report.openingInventoryCost.toLocaleString("en-AU", { style: "currency", currency: "AUD" })} came from the {report.inventoryBudget.toLocaleString("en-AU", { style: "currency", currency: "AUD" })} inventory budget. Unused budget did not become cash. Operating cash started at {report.openingCash.toLocaleString("en-AU", { style: "currency", currency: "AUD" })} and is used only for replenishment.
      </p>
      <h3>Product sample</h3>
      <p>The full catalogue has 48 products. These four show the mix: long-life pantry stock, chilled milk, and short-life ready meals.</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Cost</th>
            <th>Price</th>
            <th>Opening qty</th>
            <th>Shelf life</th>
          </tr>
        </thead>
        <tbody>
          {report.catalogueSample.map((product) => (
            <tr key={product.sku}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.unit_cost.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}</td>
              <td>{product.unit_price.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}</td>
              <td>{product.initial_qty}</td>
              <td>{product.perishable ? `${product.shelf_life_days} days` : "Does not expire"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
