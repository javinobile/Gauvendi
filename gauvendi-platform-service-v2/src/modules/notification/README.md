# Notification Module

This module provides email notification functionality converted from Java to NestJS, including SendGrid integration and email history tracking.

## Features

- ✅ SendGrid email service integration
- ✅ MongoDB email history tracking
- ✅ CPP booking confirmation emails
- ✅ Dynamic template support
- ✅ Attachment support (PDF generation ready)
- ✅ Multi-language support
- ✅ Error handling and retry mechanism

## Setup

### 1. Environment Variables

Add these environment variables to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_EMAIL=no-reply@gauvendi.com
SENDGRID_SENDER_NAME=GauVendi
SENDGRID_BOOKING_CONFIRMATION_TEMPLATE=d-a7c2b34944ed42a3a6dfc029edcd3f58

# MongoDB Configuration (already configured in database.module.ts)
MONGO_USERNAME=your_mongo_username
MONGO_PASSWORD=your_mongo_password
MONGO_HOST=your_mongo_host
MONGO_EMAIL_HISTORY_DB=email_history

# IBE URLs
IBE_CPP_BOOKING_CONFIRMATION_URL=https://ibe-v1-qa.gauvendi.com/payment-confirmation
```

### 2. Import Module

Add the NotificationModule to your main app module:

```typescript
import { Module } from '@nestjs/common';
import { NotificationModule } from './modules/notification';

@Module({
  imports: [
    // ... other modules
    NotificationModule
  ]
})
export class AppModule {}
```

## Usage

### API Endpoints

#### Send CPP Booking Confirmation Email

```http
POST /notification/cpp-booking-confirmation
Content-Type: application/json

{
  "bookingId": "booking-123",
  "translateTo": "EN",
  "hotelTemplateEmail": "CPP_BOOKING_CONFIRMATION"
}
```

#### Send Booking Confirmation Email (Alias)

```http
POST /notification/booking-confirmation
Content-Type: application/json

{
  "bookingId": "booking-123",
  "translateTo": "EN",
  "hotelTemplateEmail": "BOOKING_CONFIRMATION"
}
```

### Service Usage

```typescript
import { NotificationService } from './modules/notification';

@Injectable()
export class YourService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendBookingEmail(bookingId: string) {
    const result = await this.notificationService.sendCppBookingConfirmationEmail({
      bookingId,
      translateTo: 'EN'
    });

    return result;
  }
}
```

## Database Schema

The email history is stored in MongoDB with the following schema:

```typescript
{
  booking_id?: string;
  reservation_id?: string;
  code: string;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  subject?: string;
  status: 'Pending' | 'Sent' | 'Failed';
  delivered_date?: Date;
  created_date: Date;
  updated_date: Date;
}
```

## Architecture

```
notification/
├── controllers/
│   └── notification.controller.ts    # REST API endpoints
├── services/
│   ├── notification.service.ts       # Main business logic
│   └── sendgrid.service.ts          # SendGrid email service
├── dtos/
│   ├── send-confirm-booking-email.dto.ts
│   └── notification.dto.ts          # Shared interfaces
├── notification.module.ts           # Module configuration
└── index.ts                        # Exports

pdf/
├── services/
│   └── pdf.service.ts               # PDF generation service
├── pdf.module.ts                    # PDF module configuration
└── index.ts                        # Exports
```

### PDF Service

The `PdfService` provides PDF generation capabilities:

```typescript
// Generate booking confirmation PDF
const pdfContent = await pdfService.generateBookingConfirmationPdf(booking, hotel, language);

// Generate PDF from custom HTML
const pdfContent = await pdfService.generatePdfFromHtml(htmlContent, options);
```

**Features**:

- HTML-based PDF generation
- Booking confirmation templates
- Responsive design for different page sizes
- Error handling with fallbacks
- Base64 encoded output for email attachments

**Lambda Integration**: Uses the same Lambda API as Java services for consistent PDF generation:

```typescript
// PDF Generation API Configuration (matches Java: core.generate-pdf.api)
GENERATE_PDF_API_URL=https://56t0buohsk.execute-api.eu-central-1.amazonaws.com/qa/generate-reservation-pdf
GENERATE_PDF_API_KEY=DkSXCzVjmh87JN2K1T6UDavgbDjfX6Q07EHLlrVg

// CDN Configuration (matches S3Service)
S3_CDN_ENABLED=true
S3_CDN_URL=https://d2c5aqnwefk178.cloudfront.net
S3_BUCKET_NAME=gauvendi-ibe-storage-dev
```

**Flow**:

1. Call Lambda API with booking/hotel/reservation data
2. Lambda generates PDF and uploads to S3
3. Lambda returns S3 URL
4. Convert S3 URL to CDN URL using `S3_CDN_URL` (if enabled)
5. Download PDF from CloudFront URL for better performance
6. Convert to base64 for email attachment
7. Fallback to local HTML-based PDF generation if Lambda fails

## Integration Status

### ✅ Completed Integrations:

1. **`getBookingInformation()`** - ✅ Integrated with `BookingSummaryService`
   - Uses existing booking summary service to fetch complete booking data
   - Transforms data to match email service requirements
   - Supports multi-language booking information

2. **`getHotelInformation()`** - ✅ Integrated with `HotelsService`
   - Uses existing hotels service to fetch complete hotel data
   - Supports hotel configuration expansion
   - Includes fallback handling for hotel ID/code resolution
   - Provides comprehensive hotel information for email templates

3. **`getTemplateEmail()`** - ✅ Integrated with `HotelTemplateEmailService`
   - Created dedicated hotel template email repository and service
   - Supports language-specific template retrieval with fallback to English
   - Handles template enabling/disabling functionality
   - Provides complete template configuration including SendGrid template IDs

4. **`fetchEmailStaticContentTranslation()`** - ✅ Integrated with `TranslationService`
   - Created translation service with database access to static content translations
   - Supports language-specific email translations with fallback to English
   - Integrates with existing translation entities and database schema
   - Provides comprehensive email content translations for templates

5. **Email Sender Information (`from` object)** - ✅ Integrated with Hotel Entity
   - **Java Implementation**: Uses `hotel.getSenderName()` and `hotel.getSenderEmail()`
   - **NestJS Implementation**: Uses `hotel.senderName` and `hotel.senderEmail` from Hotel entity
   - **Fallback Logic**: senderName falls back to hotel.name, senderEmail falls back to config default
   - **Database Fields**: Both `sender_name` and `sender_email` columns exist in `hotel` table

6. **Data Mapping Structure** - ✅ Updated to match sample data
   - Updated `getBookingInformation()` data transformation to match actual booking data structure
   - Comprehensive mapping of all booking fields including nested objects
   - Support for complex reservation data with amenities, features, and pricing
   - Proper handling of display strings and formatted data

7. **PDF Generation (prepareReservationAttachments)** - ✅ Implemented
   - Created `PdfService` for generating booking confirmation PDFs using Lambda API
   - **Data Processing**: Matches Java `EmailServiceImpl` data processing pipeline:
     - `prepareBookingDataForPdf()` - applies same transformations as Java
     - `applyHotelConfigurationData()` - matches `getMoreDataForConfirmationBooking()`
     - `sortReservationList()` - matches `sortingReservationList()`
     - `calculateBookingTotals()` - matches `setBookingTotalAccommodationsAndServices()`
   - **PDF Generation Per Reservation**: Matches Java loop logic
     - Generates separate PDF for each reservation (matching Java `sendCppBookingConfirmationEmail`)
     - Each PDF uses `convertToFileGenerateFilter` logic for single reservation
     - Filename: `{reservationNumber}.pdf` or `{bookingNumber}-{index}.pdf`
   - **Primary Method**: Lambda API integration (matches Java implementation)
     - Calls AWS Lambda: `https://56t0buohsk.execute-api.eu-central-1.amazonaws.com/qa/generate-reservation-pdf`
     - Lambda generates PDF and uploads to S3
     - Downloads PDF from CloudFront URL for better performance
     - Converts to base64 for email attachment
   - **Fallback Method**: Local HTML to PDF generation
   - **Features**:
     - Complete data structure matching sample Lambda payload exactly
     - ISO format dates for arrival/departure (e.g., "2025-04-30T01:15:00Z")
     - Room product images mapping from `rfc.rfcImageList`
     - Tax lists mapping from `booking.bookingTaxList` and `booking.cityTaxList`
     - Additional guest list extraction from booking data
     - Payment method name from booking/reservation data
     - Amount parsing with currency code handling
     - Comprehensive amenity mapping with included/excluded flags
     - Company information when booker has company details
     - All retail and standard features with proper structure
     - Cancellation policy and payment terms mapping

### 🔄 TODO: Remaining Integration Points:

8. `updateBookingEmailSentStatus()` - Update booking status

## Error Handling

The service includes comprehensive error handling:

- Email history tracking for all send attempts
- Retry mechanism for transient failures
- Graceful degradation when templates are disabled
- Detailed logging for debugging

## Testing

```typescript
// Example test
describe('NotificationService', () => {
  it('should send CPP booking confirmation email', async () => {
    const result = await service.sendCppBookingConfirmationEmail({
      bookingId: 'test-booking-123',
      translateTo: 'EN'
    });

    expect(result.status).toBe('SUCCESS');
  });
});
```
