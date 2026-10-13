import { money, num } from "./format.js";

const EVENT_LABELS = [
  ["sold_out", "Sold out"],
  ["low_stock", "Low stock"],
  ["expiry", "Expiry"],
  ["slow_mover", "Slow mover"],
  ["replenishment", "Replenishment"],
  ["cash_constraint", "Cash constraint"],
];

export default function OperationsView({ report }) {
  const expired = report.products.filter((product) => product.expired_units > 0);
  const lost = [...report.products].filter((product) => product.lost_units > 0).sort((a, b) => b.lost_units - a.lost_units);

  return (
    <section>
      <h2>What the store did</h2>
      <p>
        The brain recorded {num(report.events.replenishment.qty)} units of replenishment costing {money(report.replenishment_spend)}.
        Closing inventory is {money(report.closing_inventory_value)}. Cash constraints in this run: {report.events.cash_constraint.count}.
      </p>
      <table>
        <thead>
          <tr>
            <th>Condition</th>
            <th>Events</th>
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {EVENT_LABELS.map(([key, label]) => (
            <tr key={key}>
              <td>{label}</td>
              <td>{num(report.events[key].count)}</td>
              <td>{num(report.events[key].qty)}</td>
              <td>{money(report.events[key].amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Write-offs</h3>
      <p>{num(report.expiry_units)} units were removed, worth {money(report.expiry_value)} at cost.</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Units</th>
          </tr>
        </thead>
        <tbody>
          {expired.map((product) => (
            <tr key={product.sku}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{num(product.expired_units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Demand the shelf could not fill</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Lost units</th>
            <th>Units sold</th>
          </tr>
        </thead>
        <tbody>
          {lost.slice(0, 8).map((product) => (
            <tr key={product.sku}>
              <td>{product.name}</td>
              <td>{num(product.lost_units)}</td>
              <td>{num(product.units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Slow movers the brain refused to restock for that reason</h3>
      <ul>
        {report.slowMovers.slice(0, 8).map((item) => (
          <li key={item.name}>{item.message}. Action: {item.action.replaceAll("_", " ")}.</li>
        ))}
      </ul>
      <h3>One decision, traced</h3>
      <p>Chicken sandwiches and sushi are the short-life lines the brain kept meeting. These rows are stored events, not a summary written afterwards.</p>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Product</th>
            <th>Event</th>
            <th>Action</th>
            <th>What was recorded</th>
          </tr>
        </thead>
        <tbody>
          {report.examples.map((event) => (
            <tr key={`${event.day_number}-${event.name}-${event.event_type}`}>
              <td>{event.day_number}</td>
              <td>{event.name}</td>
              <td>{event.event_type.replaceAll("_", " ")}</td>
              <td>{event.action.replaceAll("_", " ")}</td>
              <td>{event.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
