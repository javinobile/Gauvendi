## Function Purpose
Updates product restrictions & triggers daily restriction updates.

## Modes
1. Automated Mode (sAutomated = ON)
- Auto-calc max LOS per product/night.
- If minLOS > maxLOS → set maxLOS = minLOS.
- Users can select specific products.

2. Override Modes (only one active)
| Criteria     | overrideDefaultSetMaximum (Full Gap) | overrideDefault (Dynamic Fill) |
|--------------|--------------------------------------|----------------------------------|
| Goal         | Sell full gap as 1 booking           | Fill gap w/ multiple bookings  |
| LOS Behavior | Fixed LOS = gap size                 | LOS adjusts down to 1 night    |
| Example 4→3  | Only 3-night stay                    | 3, 2, or 1-night stays allowed |
| Best For     | Long-stay, events, premium yield     | Short-stay, low demand, OTA    |
| Advantage    | Higher ADR, less turnover            | Max occupancy, more visibility |
| Risk         | Unsold gap if no long stay           | Blocks long-stay potential     |

## Automation Logic
1. Get active room products.
2. Date range: fromDate→toDate (default today), endDate = toDate+12mo.
3. Retrieve: daily availability & current restrictions.
4. For each product:
   - Get settings automate LOS.
   - Remove old auto Min LOS.
   - Calc maxLOS from consecutive availability (if not have mis los, set minlos = 1, maxlos = 999).
   - If maxLOS < minLOS → set maxLOS = minLOS.
   - Upsert restrictions.
   - (Optional) Push to PMS.

## Rules
- One override mode at a time.
- maxLOS >= minLOS.

## Performance & Logs
- Minimize service calls.
- Log processed products, applied changes, errors/skips.
