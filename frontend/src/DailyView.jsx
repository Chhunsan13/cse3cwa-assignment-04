import { useEffect, useState } from "react";
import { money, num } from "./format.js";

export default function DailyView() {
  const [dayNumber, setDayNumber] = useState(1);
  const [day, setDay] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 60) return;
    setError("");
    fetch(`/api/run/days/${dayNumber}`)
      .then((response) => {
        if (!response.ok) throw new Error("That day could not be loaded");
        return response.json();
      })
      .then(setDay)
      .catch((err) => setError(err.message));
  }, [dayNumber]);

  return (
    <section>
      <h2>Daily report</h2>
      <label className="day-picker">
        Day
        <input
          type="number"
          min="1"
          max="60"
          value={dayNumber}
          onChange={(event) => setDayNumber(Number(event.target.value))}
        />
        <button type="button" onClick={() => setDayNumber((current) => Math.max(1, current - 1))}>Previous</button>
        <button type="button" onClick={() => setDayNumber((current) => Math.min(60, current + 1))}>Next</button>
      </label>
      {error && <p className="error">{error}</p>}
      {day && (
        <>
          <p>
            Run {day.runId}, day {day.day_number}: {day.sim_date}, {day.weekday}. {num(day.customers)} customers, {num(day.transactions)} transactions, {num(day.units_sold)} units, {money(day.revenue)} revenue.
          </p>
          <div className="metrics">
            <article className="metric"><p>Opening cash</p><strong>{money(day.opening_cash)}</strong></article>
            <article className="metric"><p>Closing cash</p><strong>{money(day.closing_cash)}</strong></article>
            <article className="metric"><p>Write-off</p><strong>{money(day.expiry_value)}</strong></article>
            <article className="metric"><p>Restock spend</p><strong>{money(day.replenishment_spend)}</strong></article>
            <article className="metric"><p>Lost units</p><strong>{num(day.lost_units)}</strong></article>
            <article className="metric"><p>Closing inventory</p><strong>{money(day.closing_inventory_value)}</strong></article>
          </div>
          <h3>Missions</h3>
          <table>
            <tbody>
              {Object.entries(day.missions).map(([mission, count]) => (
                <tr key={mission}>
                  <td>{mission.replaceAll("_", " ")}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Stock movement</h3>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Open</th>
                  <th>Received</th>
                  <th>Sold</th>
                  <th>Expired</th>
                  <th>Lost</th>
                  <th>Close</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {day.stock.filter((row) => row.sold_qty || row.received_qty || row.expired_qty || row.lost_qty).map((row) => (
                  <tr key={row.sku}>
                    <td>{row.name}</td>
                    <td>{row.opening_qty}</td>
                    <td>{row.received_qty}</td>
                    <td>{row.sold_qty}</td>
                    <td>{row.expired_qty}</td>
                    <td>{row.lost_qty}</td>
                    <td>{row.closing_qty}</td>
                    <td>{money(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Orders placed this evening</h3>
          {day.orders.length === 0 ? <p>No order. Day 60 does not order for a day 61.</p> : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Requested</th>
                  <th>Ordered</th>
                  <th>Cost</th>
                  <th>Cash before</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {day.orders.map((order) => (
                  <tr key={order.name}>
                    <td>{order.name}</td>
                    <td>{order.qty_requested}</td>
                    <td>{order.qty_ordered}</td>
                    <td>{money(order.cost)}</td>
                    <td>{money(order.cash_before)}</td>
                    <td>{order.reason.replaceAll("_", " ")}{order.constrained ? ", cut for cash" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h3>Transactions</h3>
          <p>{num(day.sales.length)} completed sales are stored for this day. The first five are below.</p>
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>Mission</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>COGS</th>
              </tr>
            </thead>
            <tbody>
              {day.sales.slice(0, 5).map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{sale.mission.replaceAll("_", " ")}</td>
                  <td>{sale.units}</td>
                  <td>{money(sale.revenue)}</td>
                  <td>{money(sale.cogs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
