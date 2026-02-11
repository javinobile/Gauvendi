Enum to Type Mapping
Enum	Likely Type	Meaning in Booking Terms	Common Exceptions Used
RSTR_LOS_MIN	Stay	Minimum Length of Stay – guest must stay at least X nights.	MinLength
RSTR_LOS_MAX	Stay	Maximum Length of Stay – guest can stay at most X nights.	MaxLength
RSTR_STAY_THROUGH_DAY	Stay	Guest must stay through a specific date (e.g., must include Christmas Eve).	MinLength / MaxLength
RSTR_AVAILABLE_PERIOD	Start or Stay (depends on usage)	Room/service available only within certain dates. If “check-in only”, use Start; if “any stay overlapping”, use Stay.	StartUtc, EndUtc
RSTR_MIN_LOS_THROUGH	Stay	Minimum length stay that must include a specific date. Similar to RSTR_STAY_THROUGH_DAY but explicitly requires min nights.	MinLength
RSTR_CLOSE_TO_ARRIVAL	Start	Close to arrival – block check-ins within X days/hours before arrival.	MinAdvance
RSTR_CLOSE_TO_DEPARTURE	End	Close to departure – block check-outs within X days/hours before departure.	MinAdvance
RSTR_CLOSE_TO_STAY_SELLABILITY	Stay	Close entire stay from being sold (block stays that overlap certain dates).	StartUtc, EndUtc
RSTR_CLOSE_TO_STAY	Stay	Block any stay overlapping given dates – very similar to RSTR_CLOSE_TO_STAY_SELLABILITY, but may apply to specific room categories or channels.	StartUtc, EndUtc

# Restriction Push Function — Developer Story & Acceptance Criteria

## Developer Story
As a developer, I need to implement a function that filters restrictions based on LOS (Length of Stay) criteria, creates PMS room product restrictions, and integrates them with the Mews **Set Restrictions** API.  
The solution must separate the 4 restriction levels (Hotel, Product, Rate, Rate & Product) into 4 dedicated functions so that each type is handled independently while still sharing common filtering and batching logic.

---

## Acceptance Criteria

### 1. Filtering Logic
1. If **only** `isPushMaxLos` is `true`, filter records with code `RSTR_LOS_MAX`.
2. If **only** `isPushMinLos` is `true`, filter records with code `RSTR_LOS_MIN`.
3. If **both** are `true`, keep all matching records.

---

### 2. Restriction Type Handling — Dedicated Functions
Implement **4 separate functions** to handle the different restriction levels:

#### `buildHotelLevelRestrictions(data)`
- `ExactRateId` = `null`
- `ResourceCategoryId` = `null`

#### `buildProductLevelRestrictions(data)`
- Only `ResourceCategoryId` present
- Map `ResourceCategoryId` from **room product code**

#### `buildRateLevelRestrictions(data)`
- Only `ExactRateId` present
- Map `ExactRateId` from **room rate plan code**

#### `buildRateAndProductLevelRestrictions(data)`
- Both `ExactRateId` and `ResourceCategoryId` present

**Notes:**
- Each function should:
  - Accept the filtered dataset
  - Transform it into the correct Mews API payload format
  - Return an array of restriction objects ready for batching

---

### 3. Restriction Creation & Integration
4. After filtering, call `createPmsRoomProductRestriction` to prepare restriction data.
5. Map the data according to the **Enum to Type Mapping** documented in `@mews-restriction.md`.
6. Send restrictions to the `SET_RESTRICTIONS_URL` endpoint.

---

### 4. API Payload Structure
Ensure all functions return payloads consistent with the required API format:

```json
{
  "Data": [
    {
      "Type": "Start",
      "ExactRateId": "ed4b660b-19d0-434b-9360-a4de2ea42eda",
      "ResourceCategoryId": "773d5e42-de1e-43a0-9ce6-f940faf2303f",
      "StartUtc": "2023-02-15T00:00:00Z",
      "EndUtc": "2023-02-22T00:00:00Z",
      "Days": {
        "Monday": false,
        "Tuesday": false,
        "Wednesday": false,
        "Thursday": false,
        "Friday": true,
        "Saturday": true,
        "Sunday": true
      },
      "MinLength": "P0M2DT0H0M0S",
      "MaxLength": "P0M7DT0H0M0S"
    }
  ]
}

Refer to official docs: https://mews-systems.gitbook.io/connector-api/operations/restrictions#set-restrictions 
5. Performance & Rate Limit Handling
Implement a groupAndBatchRestrictions(restrictions) helper:

Group by ResourceCategoryId and/or ExactRateId

Push a single grouped payload per API call

Batch requests to avoid hitting rate limits (status 429)

6. Logging & Monitoring
Add logging at each step:

Filters applied

Restriction type being processed

Batch sizes and API calls made

API responses and errors

Warn if:

No data matches the filters

Any payload fails validation before sending

7. General Requirements
Ensure all functions are modular and reusable:

filterRestrictionsByLos(data, isPushMaxLos, isPushMinLos)

buildHotelLevelRestrictions(data)

buildProductLevelRestrictions(data)

buildRateLevelRestrictions(data)

buildRateAndProductLevelRestrictions(data)

groupAndBatchRestrictions(data)

sendRestrictionsToMews(data)

Code should be optimized for performance and follow project coding standards.