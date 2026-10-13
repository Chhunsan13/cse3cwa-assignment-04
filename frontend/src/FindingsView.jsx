import { money, num, productByName } from "./format.js";

export default function FindingsView({ report }) {
  const sandwich = productByName(report.products, "Chicken sandwich");
  const sushi = productByName(report.products, "Sushi pack");
  const ready = report.categories.find((category) => category.category === "Ready meals");
  const rice = report.slowMovers.find((item) => item.name.startsWith("Jasmine rice"));

  return (
    <section>
      <h2>What the client should consider</h2>
      <p>
        Three findings from run {report.runId}. The customer counts are an assumption, not a count of people at Melbourne Town Hall, so the recommendations are next tests rather than a proven range.
      </p>
      <article className="finding">
        <h3>1. Ready meals sell out and still get thrown away</h3>
        <p><strong>Observation.</strong> Shoppers wanted more sandwiches and sushi than the shelf could sell, and some of those same packs were written off.</p>
        <p>
          <strong>Evidence.</strong> Chicken sandwiches lost {num(sandwich.lost_units)} units and sold {num(sandwich.units)}. Sushi lost {num(sushi.lost_units)} and sold {num(sushi.units)}, with {num(sushi.expired_units)} packs written off. Ready meals account for {num(ready.lost_units)} of the {num(report.lost_units)} lost units. The brain recorded {num(report.events.sold_out.count)} sold-out events and {num(report.events.expiry.count)} expiry events.
        </p>
        <p><strong>Diagnosis.</strong> Sushi lasts one selling day and sandwiches last two. An order placed at night arrives the next morning, while Friday brings 120 customers and Sunday brings 40. One reorder rule is short at lunch and still leaves packs to expire.</p>
        <p><strong>Business implication.</strong> Office lunch is the main weekday mission, so a missed sandwich is missed revenue, and the write-off is stock the store already paid for.</p>
        <p><strong>Recommendation.</strong> On the next run, size the ready-meal order to the next day’s customer count instead of a flat cover, and place a smaller Sunday order. This run does not prove the best quantity. Open the Daily view and compare a Friday with a Sunday.</p>
      </article>
      <article className="finding">
        <h3>2. The opening budget is sitting in the pantry</h3>
        <p><strong>Observation.</strong> Most of the inventory budget was spent on goods that barely moved, while fresh food was bought for only a few days.</p>
        <p>
          <strong>Evidence.</strong> The brain flagged {num(report.events.slow_mover.count)} slow movers and chose not to reorder them for that reason. {rice.message}. Opening inventory cost {money(report.openingInventoryCost)} of the {money(report.inventoryBudget)} budget. Closing inventory is still {money(report.closing_inventory_value)}.
        </p>
        <p><strong>Diagnosis.</strong> Pantry lines were opened with many weeks of cover. The brain can refuse a new order. It cannot return stock that is already on the shelf.</p>
        <p><strong>Business implication.</strong> Money is tied up in rice, pasta and water that will not sell inside 60 days, while ready meals are the lines that ran out.</p>
        <p><strong>Recommendation.</strong> Cut non-perishable opening cover to about four weeks on the next catalogue, and keep the rule that does not reorder a line with more than 45 days of stock.</p>
      </article>
      <article className="finding">
        <h3>3. The cash limit never had to cut an order</h3>
        <p><strong>Observation.</strong> Operating cash grew, and no replenishment was reduced because the till was short.</p>
        <p>
          <strong>Evidence.</strong> Cash started at {money(report.openingCash)}, replenishment cost {money(report.replenishment_spend)}, and cash closed at {money(report.closing_cash)}. Cash-constraint events: {num(report.events.cash_constraint.count)}. The assurance cash check is {report.assurance.cash}, and no order cost more than the cash on hand when it was placed.
        </p>
        <p><strong>Diagnosis.</strong> The margin on sales put cash back faster than the brain spent it. The cut-order rule is in the model, but this demand assumption never reached it.</p>
        <p><strong>Business implication.</strong> A rising cash balance does not show that a larger fresh range would still be affordable. It shows this particular demand assumption was profitable.</p>
        <p><strong>Recommendation.</strong> Before widening the fresh range, make a new run with lower opening cash or a larger ready-meal target. Do not edit run {report.runId}.</p>
      </article>
    </section>
  );
}
