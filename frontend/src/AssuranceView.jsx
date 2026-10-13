import { num } from "./format.js";

export default function AssuranceView({ report }) {
  const checks = [
    ["Stock", report.assurance.stock, "Opening + received − sold − expired = closing for every product-day. Negative closing stock rows: " + report.assurance.negativeStockRows + "."],
    ["Revenue", report.assurance.revenue, "The 60-day revenue equals the sum of the stored transaction totals."],
    ["Cash", report.assurance.cash, "Closing cash = opening cash + sales − replenishment. Orders that spent more than the cash on hand: " + report.assurance.ordersOverCash + "."],
  ];
  const kept = report.assurance.retained;
  return (
    <section>
      <h2>Can the client trust the report</h2>
      <p>
        Submitted run {report.runId} keeps {kept.days}/60 days. A stockout or a write-off is a business result. An integrity failure would be a contradiction in the stored history.
      </p>
      <div className="checks">
        {checks.map(([label, status, detail]) => (
          <article key={label} className={status === "PASS" ? "check pass" : "check fail"}>
            <p>{label}</p>
            <strong>{status}</strong>
            <span>{detail}</span>
          </article>
        ))}
      </div>
      <h3>History retained</h3>
      <table>
        <tbody>
          <tr><td>Products</td><td>{num(kept.products)}</td></tr>
          <tr><td>Daily stock rows</td><td>{num(kept.stock_rows)}</td></tr>
          <tr><td>Transactions</td><td>{num(kept.transactions)}</td></tr>
          <tr><td>Transaction lines</td><td>{num(kept.lines)}</td></tr>
          <tr><td>Replenishment orders</td><td>{num(kept.orders)}</td></tr>
          <tr><td>Store Brain events</td><td>{num(kept.events)}</td></tr>
          <tr><td>Stock rows that do not reconcile</td><td>{num(report.assurance.stockMismatches)}</td></tr>
        </tbody>
      </table>
      <p>
        Expired units are removed before customers shop, and the oldest remaining batch is sold first. Because every product-day reconciles, the units sold were still on hand after that morning’s write-off.
      </p>
    </section>
  );
}
