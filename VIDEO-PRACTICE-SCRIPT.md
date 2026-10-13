# Video script

Open http://localhost:5173. The page starts on 60-day report. Click Model first.

## Model

Point at the top of the page.

Say: This is a 60-day model of a small supermarket near Swanston Street. No staff are in the store. The system records sales, removes expired food, and reorders only if it has cash. These customer numbers are my assumptions, not real shop data.

Point at the opening inventory and opening cash sentence.

Say: The inventory budget is 40,000 dollars. Opening stock cost 36,612 dollars 50 cents. The leftover budget does not become cash. Operating cash starts at 15,000 dollars and is only for restocking.

Point at the product sample. Rice, then milk, then the sandwich, then sushi.

Say: There are 48 products. Rice does not expire. Milk lasts 10 days. A chicken sandwich lasts 2 days, and sushi lasts 1 day.

Point at Friday and Sunday in the customer table.

Say: Friday is the busiest day, with 120 customers. Sunday is the quietest, with 40. Weekdays are mostly office lunches. Weekends are mostly household shops.

Point at the Store Brain list.

Say: Each morning the store takes yesterday’s delivery, throws out food that expires today, then serves customers. It sells the oldest batch first. At night it reorders anything below two days of cover. If cash is short, it cuts the order. It does not order after day 60.

## 60-day report

Click 60-day report. Point at run 1 at the top.

Say: This is submitted run 1. Every figure comes from that stored run.

Point at customers, revenue, gross profit, and closing cash.

Say: The store served 4,990 customers. Revenue was 82,938 dollars 80 cents. Gross profit was 39,418 dollars 50 cents. Cash closed at 78,043 dollars 75 cents.

Point at the bars.

Say: Green bars are weekdays. Orange bars are the weekend. Weekdays are busier because of the office crowd.

Point at Grocery, then Ready meals, in the category table.

Say: Grocery made the most revenue. Ready meals are the problem, because they sold out and were also thrown away.

## Operations

Click Operations. Point at Sold out, Expiry, and Cash constraint.

Say: The brain recorded 235 sold-out events and 67 expiry write-offs. Cash constraints are zero, because this run never ran out of cash.

Point at the chicken sandwich rows under “One decision, traced”.

Say: The sandwich shelf was empty. The stored action was to reorder if the store had cash.

## Findings

Click Findings. Point at finding 1.

Say: The problem is ready meals. Sandwiches sold 546 units, but customers still wanted 415 more. Sushi sold out and was written off. Ready meals caused 663 of the 888 lost sales. The food lasts one or two days, the new stock arrives the next morning, and Friday is much busier than Sunday. I would size the next order to the next day’s customers, and order less on Sunday.

Point at finding 2.

Say: Too much of the 40,000 dollar budget is sitting in pantry stock such as rice. The brain stopped reordering those slow lines, but it cannot return stock that was already bought.

Point at finding 3.

Say: Cash grew, and no order was cut. That does not prove a bigger fresh range would still be affordable. A new test would be a new run. I would not change run 1.

## Daily

Click Daily. Type 1 in the day box. Point at Chicken sandwich in the stock table.

Say: This traces that sandwich result to Monday 3 August 2026, day 1. It opened with 12, sold all 12 for 94 dollars 80 cents, lost 7 more sales, and closed at zero. That is the same sold-out decision, stored on the day it happened.

## Assurance

Click Assurance. Point at Stock, then Revenue, then Cash.

Say: Stock passes. Opening plus received, minus sold, minus expired, equals closing. Revenue passes. The 60-day total matches the stored sales. Cash passes. Closing cash is the 15,000 dollars we started with, plus sales, minus restocking. No order spent more than the cash on hand.

Point at the 60 days in the history table.

Say: All 60 days are kept, with the sales, stock, orders, and brain events. A stockout is a business result, not a broken record.

Stay on this page.

Say: Cursor helped me draft the products, the customer model, the simulation, the Store Brain, and these pages. I checked the budget, these three pass results, and the sandwich numbers on day 1. I am responsible for run 1.
