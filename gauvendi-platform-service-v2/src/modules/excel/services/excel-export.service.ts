import { BadRequestException, Injectable } from '@nestjs/common';
import { DATE_FORMAT_EXCEL } from '@src/core/constants/date.constant';
import { groupByToMap } from '@src/core/utils/group-by.util';
import { HotelRepository } from '@src/modules/hotel/repositories/hotel.repository';
import { ReservationAmenityRepository } from '@src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { ReservationService } from '@src/modules/reservation/services/reservation.service';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import { differenceInDays, format } from 'date-fns';
import { ExportReservationDto } from '../dtos/export-excel.dto';
import { ExcelColumnConfig, ExcelExportOptions } from '../interfaces/excel-config.interface';
import { ReservationExportData } from '../interfaces/reservation-export-data.interface';
import { ExcelService } from './excel.service';
import { TaxSettingEnum } from '@src/core/enums/common';

/**
 * Excel Export Service
 *
 * Service chuyên xử lý export operations
 * Implement business logic cho từng loại export
 *
 * @example
 * ```typescript
 * const buffer = await excelExportService.exportBookings(options);
 * ```
 */
@Injectable()
export class ExcelExportService {
  constructor(
    private readonly excelService: ExcelService,
    private readonly reservationService: ReservationService,
    private readonly hotelRepository: HotelRepository,
    private readonly roomProductRepository: RoomProductRepository,
    private readonly reservationAmenityRepository: ReservationAmenityRepository
  ) {}

  /**
   * Export reservations to Excel
   *
   *
   * @param options - Export options
   * @returns Excel file buffer
   */
  async exportReservations(options: ExportReservationDto): Promise<Buffer | false> {
    const hotel = await this.hotelRepository.getHotelByIdOrCode(options.hotelId);
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    const { data } = await this.reservationService.getReservationManagementList({
      hotelId: hotel.id,
      bookingChannelList: options.bookingChannelList,
      bookingFlowList: options.bookingFlowList,
      bookingSourceList: options.bookingSourceList,
      promoCodeList: options.promoCodeList,
      isPmsSync: options.isPmsSync,
      text: options.text,
      reservationNumbers: options.reservationNumbers,
      reservationIds: options.reservationIds,
      bookingId: options.bookingId,
      statusList: options.statusList,
      fromDate: options.fromDate,
      toDate: options.toDate,
      pageSize: 999999,
      sort: options.sort,
      relations: ['ratePlan']
    });

    if (data.length === 0) {
      return false;
    }

    const roomProductIds = data
      .map((reservation) => reservation.roomProduct?.id || '')
      .filter((id) => !!id);

    const roomProductRetailFeatures = await this.roomProductRepository.findRetailFeatures({
      roomProductIds,
      hotelId: hotel.id,
      relations: {
        retailFeature: true
      }
    });

    const roomProductRetailFeaturesMap = groupByToMap(
      roomProductRetailFeatures,
      (item) => item.roomProductId
    );

    const reservationAmenities = await this.reservationAmenityRepository.findAll({
      reservationIds: data.map((item) => item.id),
      relations: {
        hotelAmenity: true
      }
    });

    const reservationAmenitiesMap = groupByToMap(
      reservationAmenities,
      (item) => item.reservationId!
    );

    // Transform reservations to export data format
    const exportData: ReservationExportData[] = data.map((reservation) => {
      const retailFeatures =
        reservation.roomProduct &&
        reservation.roomProduct.id &&
        roomProductRetailFeaturesMap.get(reservation.roomProduct.id)
          ? (roomProductRetailFeaturesMap.get(reservation.roomProduct.id) || []).map(
              (item) => item.retailFeature
            )
          : [];

      const amenities = reservationAmenitiesMap.get(reservation.id) || [];

      const totalExtraAmount = amenities.reduce((sum, amenity) => {
        if (hotel?.taxSetting === TaxSettingEnum.INCLUSIVE) {
          return sum + (amenity.totalGrossAmount || 0);
        } else {
          return sum + (amenity.totalBaseAmount || 0);
        }
      }, 0);
      const totalRevenue =
        hotel?.taxSetting === TaxSettingEnum.INCLUSIVE
          ? reservation?.totalGrossAmount || 0
          : reservation?.totalBaseAmount || 0;
      const totalCityTax = reservation.cityTaxAmount || 0;

      let totalAccommodationAmount = Number(totalRevenue) - totalExtraAmount - totalCityTax;
      totalAccommodationAmount = totalAccommodationAmount < 0 ? 0 : totalAccommodationAmount;

      const result: ReservationExportData = {
        hotelName: hotel.name || '',
        reservationNumber: reservation.reservationNumber || '',
        bookingNumber: reservation.booking?.bookingNumber || '',
        mainGuest:
          reservation.primaryGuest?.firstName + ' ' + reservation.primaryGuest?.lastName || '',
        guestEmail: reservation.primaryGuest?.emailAddress || '',
        guestPhone: reservation.primaryGuest?.phoneNumber || '',
        company: reservation.company?.name || null,
        companyEmail: reservation.company?.email || null,
        arrival: reservation.arrival
          ? format(new Date(reservation.arrival), DATE_FORMAT_EXCEL)
          : null,
        departure: reservation.departure
          ? format(new Date(reservation.departure), DATE_FORMAT_EXCEL)
          : null,
        reservationNights:
          reservation.departure && reservation.arrival
            ? differenceInDays(reservation.departure, reservation.arrival)
            : 0,
        adults: reservation.adult || 0,
        childrenAges: reservation.children || 0,
        pets: reservation.pets || 0,
        bookingDate: reservation.booking?.createdAt
          ? format(new Date(reservation.booking.createdAt), DATE_FORMAT_EXCEL)
          : reservation.createdAt
            ? format(new Date(reservation.createdAt), DATE_FORMAT_EXCEL)
            : null,
        unitNumber: reservation.unitAssigned || null,
        productCode: reservation.roomProduct?.code || '',
        productName: reservation.roomProduct?.name || '',
        totalRevenue: reservation.totalGrossAmount || 0,
        paidAmount: reservation.payOnConfirmationAmount || 0,
        balance: reservation.balance || 0,
        status: reservation.status || '',
        bookingFlow: reservation?.bookingFlow || '',
        channel: reservation?.channel || '',
        bookingSource: reservation?.source || '',
        paymentMode: reservation.paymentMethod?.code || '',
        cxlPolicy: reservation.cancellationPolicy?.code || '',
        salesPlan: reservation.ratePlan?.name || '',
        promoCode: reservation.promoCodeList?.join(', ') || null,
        reservationNote: reservation.note || null,
        guaranteedFeatures: retailFeatures.map((item) => item.code).join(', ') || '',
        extras: amenities.map((item) => item.hotelAmenity?.code).join(', ') || '',
        totalExtraAmount: totalExtraAmount,
        totalAccommodationAmount: totalAccommodationAmount,
        totalCityTax: totalCityTax
      };

      return result;
    });

    // Define columns based on format
    const columns = this.getBookingColumns(options.format);

    const exportOptions: ExcelExportOptions = {
      columns,
      sheetName: options.sheetName || 'Reservation Data',
      includeHeader: options.includeHeader !== false,
      // autoFilter: options.autoFilter !== false,
      autoFilter: false,
      styling:
        options.applyStyling !== false
          ? {
              headerBackground: 'ffcc00',
              headerFontColor: '000000',

              headerFontSize: 12,
              headerBold: true,
              borders: true
            }
          : undefined
    };

    return await this.excelService.exportToExcel(exportData, exportOptions);
  }

  /**
   * Get booking column configuration for reservations export
   *
   * @param format - Export format type
   * @returns Column configurations
   */
  private getBookingColumns(format?: string): ExcelColumnConfig[] {
    const allColumns: ExcelColumnConfig[] = [
      { key: 'hotelName', header: 'Hotel name', width: 25 },
      { key: 'reservationNumber', header: 'Reservation number', width: 20 },
      { key: 'bookingNumber', header: 'Booking number', width: 20 },
      { key: 'mainGuest', header: 'Main guest', width: 25 },
      { key: 'guestEmail', header: 'Guest email', width: 30 },
      { key: 'guestPhone', header: 'Guest phone', width: 18 },
      { key: 'company', header: 'Company', width: 25 },
      { key: 'companyEmail', header: 'Company email', width: 30 },
      { key: 'arrival', header: 'Arrival', width: 15, format: 'date' },
      { key: 'departure', header: 'Departure', width: 15, format: 'date' },
      { key: 'reservationNights', header: 'Reservation nights', width: 18 },
      { key: 'adults', header: 'Adult(s)', width: 12 },
      { key: 'childrenAges', header: 'Child(ren)', width: 12 },
      { key: 'pets', header: 'Pet(s)', width: 12 },
      { key: 'bookingDate', header: 'Booking date', width: 18, format: 'date' },
      { key: 'unitNumber', header: 'Unit number', width: 15 },
      { key: 'productCode', header: 'Product code', width: 18 },
      { key: 'productName', header: 'Product name', width: 30 },
      { key: 'totalRevenue', header: 'Total revenue', width: 18, format: 'currency' },
      {
        key: 'totalAccommodationAmount',
        header: 'Total accommodation',
        width: 22,
        format: 'currency'
      },
      { key: 'totalExtraAmount', header: 'Total extra', width: 18, format: 'currency' },
      { key: 'totalCityTax', header: 'Total city tax', width: 18, format: 'currency' },
      { key: 'paidAmount', header: 'Paid amount', width: 18, format: 'currency' },
      { key: 'balance', header: 'Balance', width: 18, format: 'currency' },
      { key: 'status', header: 'Status', width: 15 },
      { key: 'bookingFlow', header: 'Booking flow', width: 18 },
      { key: 'channel', header: 'Channel', width: 20 },
      { key: 'bookingSource', header: 'Booking source', width: 20 },
      { key: 'paymentMode', header: 'Payment mode', width: 18 },
      { key: 'cxlPolicy', header: 'CXL Policy', width: 25 },
      { key: 'salesPlan', header: 'Sales plan', width: 25 },
      { key: 'promoCode', header: 'Promo code', width: 18 },
      { key: 'reservationNote', header: 'Reservation note', width: 80 },
      { key: 'guaranteedFeatures', header: 'Guaranteed features', width: 80 },
      { key: 'extras', header: 'Extras', width: 30 }
    ];

    // Return different columns based on format
    if (format === 'summary') {
      return allColumns.filter((col) =>
        [
          'hotelName',
          'reservationNumber',
          'bookingNumber',
          'mainGuest',
          'arrival',
          'departure',
          'status',
          'totalRevenue'
        ].includes(col.key)
      );
    }

    if (format === 'basic') {
      return allColumns.filter((col) =>
        [
          'hotelName',
          'reservationNumber',
          'bookingNumber',
          'mainGuest',
          'guestEmail',
          'guestPhone',
          'arrival',
          'departure',
          'reservationNights',
          'productName',
          'totalRevenue',
          'totalAccommodationAmount',
          'totalExtraAmount',
          'status',
          'channel'
        ].includes(col.key)
      );
    }

    // Default: return all columns (detailed format)
    return allColumns;
  }
}
