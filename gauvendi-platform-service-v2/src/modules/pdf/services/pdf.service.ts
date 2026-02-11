import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { TaxSettingEnum } from '@src/core/enums/common';
import { S3Service } from '@src/core/s3/s3.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PdfService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Generate PDF from HTML content
   * @param htmlContent HTML string to convert to PDF
   * @param options PDF generation options
   * @returns Base64 encoded PDF content
   */
  async generatePdfFromHtml(
    htmlContent: string,
    options: {
      format?: 'A4' | 'A3' | 'Letter';
      orientation?: 'portrait' | 'landscape';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
    } = {}
  ): Promise<string> {
    try {
      // For now, we'll create a mock PDF content
      // In a real implementation, you would use puppeteer or similar:
      /*
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: options.margin || { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      await browser.close();
      return pdfBuffer.toString('base64');
      */

      // Mock implementation - returns a base64 encoded mock PDF
      const mockPdfContent = this.createMockPdfContent(htmlContent);
      return Buffer.from(mockPdfContent).toString('base64');
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate booking confirmation PDF
   * @param booking Booking data
   * @param hotel Hotel data
   * @param language Language code
   * @returns Base64 encoded PDF content
   */
  async generateBookingConfirmationPdf(
    booking: any,
    hotel: any,
    language: string = 'EN'
  ): Promise<{
    content: string;
    downloadUrl?: string;
  }> {
    try {
      // Call Lambda API to generate PDF
      const { content, downloadUrl } = await this.generatePdfFromLambda(booking, hotel, language);

      return {
        content: content,
        downloadUrl: downloadUrl
      };
    } catch (error) {
      // Fallback to local HTML-based PDF generation
      const htmlContent = this.buildBookingConfirmationHtml(booking, hotel, language);
      const pdfContent = await this.generatePdfFromHtml(htmlContent, {
        format: 'A4',
        orientation: 'portrait',
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return {
        content: pdfContent
      };
    }
  }

  /**
   * Generate PDF using Lambda API (matches Java implementation)
   */
  private async generatePdfFromLambda(
    booking: any,
    hotel: any,
    language: string
  ): Promise<{
    content: string;
    downloadUrl: string;
  }> {
    try {
      // Use environment variables (matching Java: @Value("${core.generate-pdf.api}"))
      const generatePdfUrl = this.configService.get<string>(ENVIRONMENT.GENERATE_PDF_API_URL);
      const generatePdfApiKey = this.configService.get<string>(ENVIRONMENT.GENERATE_PDF_API_KEY);

      if (!generatePdfUrl) {
        throw new Error('GENERATE_PDF_API_URL environment variable is not configured');
      }
      if (!generatePdfApiKey) {
        throw new Error('GENERATE_PDF_API_KEY environment variable is not configured');
      }

      // Prepare request payload (matching Java GenerateReservationFileInput)
      const requestPayload = this.buildLambdaRequestPayload(booking, hotel, language);

      // Call Lambda API
      let response;
      try {
        response = await firstValueFrom(
          this.httpService.post(generatePdfUrl, requestPayload, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-API-Key': generatePdfApiKey // Header name must match Java: "X-API-Key"
            },
            timeout: 30000 // 30 seconds timeout
          })
        );
      } catch (httpError: any) {
        throw new Error(`Lambda API call failed: ${httpError.message}`);
      }

      // Check response
      if (response.status !== 200) {
        throw new Error(`Lambda API returned status ${response.status}`);
      }

      const responseBody = response.data;

      // Check response format (matching Java logic)
      if (!responseBody) {
        throw new Error('Lambda API returned empty response');
      }

      // Java expects: { statusCode: "200", body: "s3-url" }
      const status = responseBody.statusCode?.toString();
      const s3FileUrl = responseBody.body?.toString();

      if (!status || status !== '200') {
        throw new Error(`Lambda API failed with statusCode: ${status}`);
      }

      if (!s3FileUrl) {
        throw new Error('Lambda API did not return S3 file URL in body');
      }

      // Convert S3 URL to CDN URL if available
      const downloadUrl = this.convertToCdnUrl(s3FileUrl);

      // Download PDF from CloudFront/S3 and convert to base64
      const fileBuffer = await this.downloadPdfFromUrl(downloadUrl);
      if (!fileBuffer) {
        throw new Error('Failed to download PDF from CloudFront/S3');
      }

      const base64Content = fileBuffer.toString('base64');

      return {
        content: base64Content,
        downloadUrl: downloadUrl
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert S3 URL to CDN URL if CDN is configured (matching S3Service logic)
   */
  private convertToCdnUrl(s3Url: string): string {
    try {
      const cdnUrl = this.configService.get<string>(ENVIRONMENT.S3_CDN_URL);
      const cdnEnabled = this.configService.get<string>(ENVIRONMENT.S3_CDN_ENABLED) === 'true';

      if (!cdnEnabled || !cdnUrl) {
        return s3Url; // Return original S3 URL if CDN not configured
      }

      // Extract key from S3 URL
      let key = s3Url;
      const bucketName = this.configService.get<string>(ENVIRONMENT.S3_BUCKET_NAME) || '';

      if (s3Url.includes('amazonaws.com/')) {
        // Handle S3 URLs like: https://bucket-name.s3.region.amazonaws.com/path/file.pdf
        const urlParts = s3Url.split('/');
        const bucketIndex = urlParts.findIndex((part) => part.includes(bucketName));
        if (bucketIndex !== -1) {
          key = urlParts.slice(bucketIndex + 1).join('/');
        }
      } else if (s3Url.startsWith('https://')) {
        // Handle other S3 URL formats
        const url = new URL(s3Url);
        key = url.pathname.substring(1); // Remove leading slash
      }

      // Construct CDN URL
      const baseUrl = cdnUrl.replace(/\/$/, ''); // Remove trailing slash
      const cdnFullUrl = `${baseUrl}/${key}`;

      return cdnFullUrl;
    } catch (error) {
      return s3Url; // Fallback to original URL
    }
  }

  /**
   * Download PDF from URL (CloudFront or S3)
   */
  private async downloadPdfFromUrl(url: string): Promise<Buffer | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000
        })
      );

      if (response.status !== 200) {
        throw new Error(`Failed to download PDF: HTTP ${response.status}`);
      }

      return Buffer.from(response.data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Build Lambda request payload (matching sample data structure exactly)
   */
  private buildLambdaRequestPayload(booking: any, hotel: any, language: string): any {
    // Get first reservation for PDF generation (matching Java logic)
    const reservation = booking.mailReservationList?.[0]?.reservation;
    if (!reservation) {
      throw new Error('No reservation found for PDF generation');
    }

    // Convert arrival/departure to ISO format (matching sample data)
    const arrivalDate = reservation.arrival;
    const departureDate = reservation.departure;

    // Build payload matching sample data structure exactly
    return {
      locale: language.toLowerCase(), // Java expects lowercase

      // Hotel structure (matching sample data)
      hotel: {
        code: hotel.code,
        name: hotel.name,
        address: hotel.address,
        url: hotel.hotelWebsiteUrl || hotel.websiteUrl || 'test',
        phone: hotel.phone,
        logo: hotel.emailImageUrl || hotel.iconImageUrl,
        baseCurrencyCode: hotel.baseCurrency?.code,
        timeZone: hotel.timeZone,
        isTaxIncluded: hotel.taxSetting === TaxSettingEnum.INCLUSIVE,
        taxInformation: hotel.taxInformation
      },

      // BrandingMarketing structure (matching sample data)
      brandingMarketing: {
        hotelImageCoverUrl:
          hotel.propertyImageCoverUrl || hotel.brandingMarketing?.hotelImageCoverUrl,
        hotelImagePreviewUrl:
          hotel.propertyImagePreviewUrl || hotel.brandingMarketing?.hotelImagePreviewUrl,
        googleMapUrl: hotel.brandingMarketing?.googleMapUrl,
        socialMedia: hotel.brandingMarketing?.socialMedia || {
          facebook: null,
          linkedin: null,
          instagram: null
        }
      },

      // Booking structure (matching sample data)
      booking: {
        bookingNumber: booking.bookingNumber,
        bookingComment: booking.booker?.guestNote || booking.specialRequest || null,
        cityTaxList: booking.cityTaxList || []
      },

      // Reservation structure (matching sample data exactly)
      reservation: {
        reservationNumber: reservation.reservationNumber || `${booking.bookingNumber}01`,
        arrival: arrivalDate, // ISO format like "2025-04-30T01:15:00Z"
        departure: departureDate, // ISO format like "2025-05-02T23:15:00Z"

        // Room Product (detailed mapping matching sample)
        roomProduct: {
          code: reservation.rfc?.code,
          name: reservation.rfc?.name,
          description: reservation.rfc?.description,
          numberOfBedrooms: reservation.rfc?.numberOfBedrooms,
          space: reservation.rfc?.space,
          roomProductImageList: (reservation.rfc?.rfcImageList || []).map((image: any) => ({
            imageUrl: image.imageUrl
          })),
          retailFeatureList: (reservation.rfc?.retailFeatureList || []).map((feature: any) => ({
            code: feature.code,
            name: feature.name,
            measurementUnit: feature.measurementUnit
          }))
        },

        // Guest information (matching sample data)
        adult: reservation.adult || 1,
        childrenAgeList: reservation.childrenAgeList || [],
        pets: reservation.pets || 0,

        // Amount calculations (matching sample data with proper numbers)
        totalAccommodationAmount: this.parseAmount(reservation.totalAccommodations),
        totalAmount: this.parseAmount(booking.totalGrossAmountStr),
        paidAmount: this.parseAmount(booking.paidAmountStr),
        balance: this.parseAmount(booking.totalAmountDueStr),
        payOnConfirmationAmount: this.parseAmount(booking.paidAmountStr),
        payAtHotelAmount: this.parseAmount(booking.totalAmountDueStr),

        // Tax information (mapping from booking data)
        taxList: (booking.bookingTaxList || []).map((tax: any) => ({
          name: tax.name,
          amount: tax.amount
        })),
        cityTaxList: (booking.cityTaxList || []).map((tax: any) => ({
          name: tax.name,
          amount: tax.amount || tax.cityTaxAmount
        })),

        // Amenities (detailed mapping matching sample structure)
        amenityList: [
          ...(reservation.includedServiceList || []).map((service: any) => ({
            name: service.hotelAmenity?.name,
            code: service.hotelAmenity?.code,
            count: service.totalCount || 0,
            totalAmount: this.parseAmount(service.totalGrossAmountStr),
            included: true
          })),
          ...(reservation.extraServiceList || []).map((service: any) => ({
            name: service.hotelAmenity?.name,
            code: service.hotelAmenity?.code,
            count: service.totalCount || 0,
            totalAmount: this.parseAmount(service.totalGrossAmountStr),
            included: false
          }))
        ],

        // Comments
        reservationComment: reservation.guestNote || null,

        // Additional guests (mapping from booking data)
        additionalGuestList: this.extractAdditionalGuestList(reservation),

        // Primary guest details (comprehensive mapping)
        primaryGuest: {
          firstName: booking.primaryGuest?.firstName,
          lastName: booking.primaryGuest?.lastName,
          emailAddress: booking.primaryGuest?.emailAddress,
          phoneNumber: booking.primaryGuest?.phoneNumber,
          countryNumber: booking.primaryGuest?.countryNumber
        },

        // Cancellation policy (matching sample structure)
        cxlPolicy: booking.cxlPolicy
          ? {
              description: booking.cxlPolicy.description
            }
          : null,

        // Payment term (matching sample structure)
        paymentTerm: booking.paymentTerm
          ? {
              description: booking.paymentTerm.description,
              payAtHotelDescription: booking.paymentTerm.payAtHotelDescription,
              payOnConfirmationDescription: booking.paymentTerm.payOnConfirmationDescription
            }
          : null,

        // Sales plan (rate plan information matching sample)
        salesPlan: reservation.rfcRatePlan?.ratePlan
          ? {
              id: reservation.rfcRatePlan.ratePlan.id,
              code: reservation.rfcRatePlan.ratePlan.code,
              name: reservation.rfcRatePlan.ratePlan.name,
              description: reservation.rfcRatePlan.ratePlan.description
            }
          : null,

        // Features (matching sample structure)
        retailFeatureList: (reservation.matchedFeatureList || []).map((feature: any) => ({
          id: feature.id,
          code: feature.code,
          name: feature.name,
          description: feature.description,
          quantity: feature.quantity
        })),

        standardFeatureList: (reservation.rfc?.standardFeatureList || []).map((feature: any) => ({
          id: feature.id,
          code: feature.code,
          name: feature.name,
          quantity: feature.quantity || 1
        })),

        // Payment method name (from booking data)
        paymentMethodName: reservation.paymentMethodName || null,

        // Company information (if booker has company - matching sample structure)
        company: booking.booker?.companyName
          ? {
              name: booking.booker.companyName,
              address: booking.booker.address,
              city: booking.booker.companyCity,
              country: booking.booker.companyCountryName
            }
          : null
      }
    };
  }

  /**
   * Parse amount string to number (handles currency formatting)
   */
  private parseAmount(amountStr: string | number): number {
    if (typeof amountStr === 'number') return amountStr;
    if (!amountStr) return 0;

    // Remove currency code and parse number
    const cleanAmount = amountStr.toString().replace(/[^\d.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  }

  /**
   * Extract additional guest list from booking data
   */
  private extractAdditionalGuestList(reservation: any): any[] {
    if (!reservation?.additionalGuest?.length) {
      return [];
    }

    return (
      reservation.additionalGuest.map((guest: any) => ({
        firstName: guest.firstName,
        lastName: guest.lastName
      })) || []
    );
  }

  /**
   * Build HTML content for booking confirmation
   */
  private buildBookingConfirmationHtml(booking: any, hotel: any, language: string): string {
    const currencySymbol = hotel.baseCurrency?.code || 'USD';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation - ${booking.bookingNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .hotel-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .booking-number {
            font-size: 18px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .label {
            font-weight: bold;
            width: 40%;
          }
          .value {
            width: 60%;
          }
          .reservation {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 5px;
          }
          .service-item {
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
          }
          .total-section {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: bold;
          }
          .grand-total {
            font-size: 18px;
            color: #2c5aa0;
            border-top: 2px solid #333;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hotel-name">${hotel.name}</div>
          <div class="booking-number">Booking Confirmation: ${booking.bookingNumber}</div>
          <div style="margin-top: 10px; font-size: 14px;">
            ${hotel.address}, ${hotel.city}${hotel.state ? ', ' + hotel.state : ''} ${hotel.postalCode || ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Guest Information</div>
          <div class="info-row">
            <div class="label">Guest Name:</div>
            <div class="value">${booking.booker?.firstName || ''} ${booking.booker?.lastName || ''}</div>
          </div>
          <div class="info-row">
            <div class="label">Email:</div>
            <div class="value">${booking.booker?.emailAddress || ''}</div>
          </div>
          <div class="info-row">
            <div class="label">Phone:</div>
            <div class="value">${booking.booker?.countryNumber || ''} ${booking.booker?.phoneNumber || ''}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Booking Details</div>
          <div class="info-row">
            <div class="label">Check-in:</div>
            <div class="value">${booking.arrivalStr || ''}</div>
          </div>
          <div class="info-row">
            <div class="label">Check-out:</div>
            <div class="value">${booking.departureStr || ''}</div>
          </div>
          <div class="info-row">
            <div class="label">Guests:</div>
            <div class="value">${booking.totalAdult || 0} Adult(s), ${booking.totalChildren || 0} Children</div>
          </div>
        </div>

        ${
          booking.mailReservationList
            ?.map(
              (mailReservation: any, index: number) => `
          <div class="reservation">
            <div class="section-title">Room ${index + 1}: ${mailReservation.reservation?.rfc?.name || ''}</div>
            
            ${
              mailReservation.reservation?.rfc?.description
                ? `
              <div class="info-row">
                <div class="label">Description:</div>
                <div class="value">${mailReservation.reservation.rfc.description}</div>
              </div>
            `
                : ''
            }
            
            <div class="info-row">
              <div class="label">Guests:</div>
              <div class="value">${mailReservation.reservation?.adult || 0} Adult(s), ${mailReservation.reservation?.children || 0} Children</div>
            </div>

            ${
              mailReservation.reservation?.includedServiceList?.length > 0
                ? `
              <div style="margin-top: 15px;">
                <strong>Included Services:</strong>
                ${mailReservation.reservation.includedServiceList
                  .map(
                    (service: any) => `
                  <div class="service-item">
                    ${service.hotelAmenity?.name || ''} ${service.totalCount ? `(${service.totalCount})` : ''}
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            ${
              mailReservation.reservation?.extraServiceList?.length > 0
                ? `
              <div style="margin-top: 15px;">
                <strong>Extra Services:</strong>
                ${mailReservation.reservation.extraServiceList
                  .map(
                    (service: any) => `
                  <div class="service-item">
                    <div style="display: flex; justify-content: space-between;">
                      <span>${service.hotelAmenity?.name || ''} ${service.totalCount ? `(${service.totalCount})` : ''}</span>
                      <span>${service.totalGrossAmountStr || ''}</span>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>
        `
            )
            .join('') || ''
        }

        <div class="total-section">
          <div class="section-title">Payment Summary</div>
          <div class="total-row">
            <span>Total Accommodations:</span>
            <span>${booking.totalAccommodations || currencySymbol + ' 0'}</span>
          </div>
          <div class="total-row">
            <span>Total Services:</span>
            <span>${booking.totalServices || currencySymbol + ' 0'}</span>
          </div>
          <div class="total-row">
            <span>Paid Amount:</span>
            <span>${booking.paidAmountStr || currencySymbol + ' 0'}</span>
          </div>
          <div class="total-row">
            <span>Amount Due at Hotel:</span>
            <span>${booking.totalAmountDueStr || currencySymbol + ' 0'}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>${booking.totalGrossAmountStr || currencySymbol + ' 0'}</span>
          </div>
        </div>

        <div class="section" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Thank you for choosing ${hotel.name}!</p>
          <p>For any questions, please contact us at ${hotel.emailAddressList?.[0] || ''} or ${hotel.phone || ''}</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Create mock PDF content for development
   */
  private createMockPdfContent(htmlContent: string): string {
    return `Mock PDF Content - Booking Confirmation
Generated from HTML content (${htmlContent.length} characters)
Generated at: ${new Date().toISOString()}

This is a mock PDF implementation. 
In production, this would be replaced with actual PDF generation using puppeteer or similar.`;
  }
}
