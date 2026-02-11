# Hotel Cancellation Policy API Test Commands

## Update Hotel Cancellation Policy

### Basic Update (without translations)
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "HTL001",
    "name": "Standard Cancellation Policy",
    "cancellationType": "FLEXIBLE",
    "hourPrior": 24,
    "displayUnit": "HOUR",
    "cancellationFeeValue": 50.00,
    "cancellationFeeUnit": "PERCENTAGE",
    "description": "Free cancellation up to 24 hours before check-in. After that, 50% of the first night will be charged."
  }'
```

### Update with ID (existing policy)
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "hotelCode": "HTL001",
    "name": "Updated Cancellation Policy",
    "cancellationType": "PARTIAL",
    "hourPrior": 48,
    "displayUnit": "HOUR",
    "cancellationFeeValue": 75.00,
    "cancellationFeeUnit": "PERCENTAGE",
    "description": "Updated policy with 48 hours notice required"
  }'
```

### Update with Translations
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "HTL001",
    "name": "Standard Cancellation Policy",
    "cancellationType": "FREE",
    "hourPrior": 24,
    "displayUnit": "HOUR",
    "cancellationFeeValue": 0,
    "cancellationFeeUnit": "FIXED_AMOUNT",
    "description": "Free cancellation up to 24 hours before check-in",
    "translationList": [
      {
        "languageCode": "vi",
        "name": "Chính sách hủy tiêu chuẩn",
        "description": "Miễn phí hủy phòng trước 24 giờ check-in"
      },
      {
        "languageCode": "fr",
        "name": "Politique d'\''annulation standard",
        "description": "Annulation gratuite jusqu'\''à 24 heures avant l'\''arrivée"
      }
    ]
  }'
```

### Non-Refundable Policy
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "HTL001",
    "name": "Non-Refundable Rate",
    "cancellationType": "NON_REFUNDABLE",
    "hourPrior": 0,
    "displayUnit": "HOUR",
    "cancellationFeeValue": 100.00,
    "cancellationFeeUnit": "PERCENTAGE",
    "description": "This rate is non-refundable. No cancellation allowed."
  }'
```

### Fixed Amount Fee Policy
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "HTL001",
    "name": "Fixed Fee Cancellation",
    "cancellationType": "PARTIAL",
    "hourPrior": 72,
    "displayUnit": "HOUR",
    "cancellationFeeValue": 25.00,
    "cancellationFeeUnit": "FIXED_AMOUNT",
    "description": "Cancellation fee of $25 applies for cancellations within 72 hours"
  }'
```

## Expected Response Format
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "hotelId": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
  "name": "Standard Cancellation Policy",
  "code": "CXL001",
  "isDefault": false,
  "cancellationType": "FLEXIBLE",
  "hourPrior": 24,
  "displayUnit": "HOUR",
  "cancellationFeeValue": 50.00,
  "cancellationFeeUnit": "PERCENTAGE",
  "description": "Free cancellation up to 24 hours before check-in",
  "translationList": [
    {
      "id": "c3d4e5f6-g7h8-9012-cdef-g34567890123",
      "hotelId": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
      "hotelCxlPolicyId": "123e4567-e89b-12d3-a456-426614174000",
      "languageCode": "vi",
      "name": "Chính sách hủy tiêu chuẩn",
      "description": "Miễn phí hủy phòng trước 24 giờ check-in"
    }
  ]
}
```

## Error Cases

### Hotel Not Found
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "INVALID_CODE",
    "name": "Test Policy"
  }'
```

### Invalid Enum Values
```bash
curl -X POST http://localhost:3000/pricing/hotel-cancellation-policy-update \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "HTL001",
    "cancellationType": "INVALID_TYPE",
    "cancellationFeeUnit": "INVALID_UNIT"
  }'
```
