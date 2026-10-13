import { money, num } from "./format.js";

export default function PerformanceView({ report }) {
  const days = report.dayCount;
  const basket = report.units_sold / report.transactions;
  const averageValue = report.revenue / report.transactions;
  const maxCustomers = Math.max(...report.activity.map((day) => day.customers));
  const top = report.products.slice(0, 5);
  const weak = [...report.products].sort((a, b) => a.units - b.units).slice(0, 5);

  return (
    <section>
      <h2>What happened over 60 days</h2>
      <div className="metrics">
        <Metric label="Customers" value={num(report.customers)} />
        <Metric label="Transactions" value={num(report.transactions)} />
        <Metric label="Units sold" value={num(report.units_sold)} />
        <Metric label="Revenue" value={money(report.revenue)} />
        <Metric label="COGS" value={money(report.cogs)} />
        <Metric label="Gross profit" value={money(report.gross_profit)} />
        <Metric label="Write-off" value={money(report.expiry_value)} />
        <Metric label="Closing cash" value={money(report.closing_cash)} />
        <Metric label="Closing inventory" value={money(report.closing_inventory_value)} />
      </div>
      <h3>Shoppers and baskets</h3>
      <p>
        Average customers per day: {num(report.customers / days)}. Average basket: {num(basket)} units.
        Average transaction value: {money(averageValue)}.
      </p>
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Days</th>
            <th>Customers</th>
            <th>Per day</th>
            <th>Transactions</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {report.periods.map((period) => (
            <tr key={period.period}>
              <td>{period.period}</td>
              <td>{period.days}</td>
              <td>{num(period.customers)}</td>
              <td>{num(period.customers / period.days)}</td>
              <td>{num(period.transactions)}</td>
              <td>{money(period.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Customers across the 60 days</h3>
      <div className="bars" aria-label="Customers per day">
        {report.activity.map((day) => (
          <div
            key={day.day_number}
            className={day.weekday === "Saturday" || day.weekday === "Sunday" ? "bar weekend" : "bar"}
            style={{ height: `${(day.customers / maxCustomers) * 100}%` }}
            title={`Day ${day.day_number} ${day.weekday}: ${day.customers} customers`}
          />
        ))}
      </div>
      <p className="note">Taller bars are busier days. Highlighted bars are Saturday and Sunday.</p>
      <h3>Categories</h3>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Units</th>
            <th>Revenue</th>
            <th>Gross profit</th>
          </tr>
        </thead>
        <tbody>
          {report.categories.map((category) => (
            <tr key={category.category}>
              <td>{category.category}</td>
              <td>{num(category.units)}</td>
              <td>{money(category.revenue)}</td>
              <td>{money(category.gross_profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="split">
        <div>
          <h3>Top sellers by revenue</h3>
          <ProductTable rows={top} />
        </div>
        <div>
          <h3>Weak sellers by units</h3>
          <ProductTable rows={weak} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ProductTable({ rows }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Units</th>
          <th>Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.sku}>
            <td>{row.name}</td>
            <td>{num(row.units)}</td>
            <td>{money(row.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
