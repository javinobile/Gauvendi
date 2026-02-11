import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInDays } from 'date-fns';
import Decimal from 'decimal.js';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelAgeCategoryCodeEnum } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import {
  HotelAmenity,
  HotelAmenityAgeCategoryPricingDto,
  HotelAmenityPricingDailyDto,
  PricingUnitEnum,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import {
  AmenityAvailabilityEnum,
  AmenityStatusEnum,
  HotelAmenityCodeSurchargeEnum,
  RoundingModeEnum,
  ServiceChargeSettingEnum,
  TaxSettingEnum
} from 'src/core/enums/common';
import { Helper } from 'src/core/helper/utils';
import { TaxInclusiveUtils } from 'src/core/utils/tax-inclusive.utils';
import { In, Repository } from 'typeorm';
import { CalculatePricingAmenityInput } from '../dtos/hotel-amenity.dto';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';

@Injectable()
export class CalculateAmenityPricingService {
  private readonly logger = new Logger(CalculateAmenityPricingService.name);

  constructor(
    @InjectRepository(HotelAmenity, DbName.Postgres)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(HotelTaxSetting, DbName.Postgres)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>
  ) {}
  /**
   * Main entry point - Calculate amenity pricing with comprehensive tax and service charge handling
   * Based on the high-level plan:
   * 1. Base Price Calculation (COMBO handling, age categories)
   * 2. Apply Quantity & Stay Length
   * 3. Service Charges + Taxes (Inclusive/Exclusive)
   * 4. Daily Breakdown with proper rounding
   */
  public async calculatePricingAmenity(
    input: CalculatePricingAmenityInput,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number }
  ): Promise<HotelAmenity> {
    const decimalUnits = hotelConfigRoundingMode.decimalPlaces;
    const roundingMode = this.mapRoundingMode(hotelConfigRoundingMode.roundingMode);

    const hotel = input.hotel;
    const serviceChargeRate = input.serviceChargeRate ?? 0;
    const serviceChargeTaxRate = input.serviceChargeTaxRate ?? 0;
    const hotelAmenity = input.hotelAmenity;
    const fromDate = input.fromDate;
    const toDate = input.toDate;
    const los = Math.max(
      1,
      Math.abs(differenceInDays(Helper.parseDateToUTC(toDate), Helper.parseDateToUTC(fromDate))) + 1
    );
    const losDecimal = new Decimal(los);

    const taxSettingList = input.hotelAmenity.taxSettingList ?? [];

    let totalBaseAmount = new Decimal(0);
    let totalBaseAmountBeforeAdjustment = new Decimal(0);
    let totalSellingRate = new Decimal(0);
    let totalSellingRateBeforeAdjustment = new Decimal(0);
    let taxAmount = new Decimal(0);
    let taxAmountBeforeAdjustment = new Decimal(0);
    let serviceChargeAmount = new Decimal(0);
    let serviceChargeAmountBeforeAdjustment = new Decimal(0);
    let totalGrossAmount = new Decimal(0);
    let totalGrossAmountBeforeAdjustment = new Decimal(0);
    let count = 0;
    let dailyPricingList: HotelAmenityPricingDailyDto[] = [];
    let ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[] = [];

    const taxDetailsMap: Record<string, Decimal> = {};

    // --- COMBO handling ---
    if (hotelAmenity.sellingType === SellingTypeEnum.COMBO) {
      try {
        const linkedAmenities = await this.getLinkedAmenities(hotelAmenity, hotel.id);

        if (linkedAmenities.length === 0) {
          const errorMsg = `COMBO ${hotelAmenity.code} has no valid linked amenities. Check linkedAmenityCode: ${hotelAmenity.linkedAmenityCode}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Store linked amenities for PMS posting
        hotelAmenity.linkedAmenityInfoList = [];

        // Create a totals object that will be mutated by aggregateTotals
        const totals = {
          totalBaseAmount: new Decimal(0),
          totalBaseAmountBeforeAdjustment: new Decimal(0),
          taxAmount: new Decimal(0),
          taxAmountBeforeAdjustment: new Decimal(0),
          serviceChargeAmount: new Decimal(0),
          serviceChargeAmountBeforeAdjustment: new Decimal(0),
          totalSellingRate: new Decimal(0),
          totalGrossAmount: new Decimal(0),
          totalGrossAmountBeforeAdjustment: new Decimal(0)
        };

        // Process each linked amenity: calculate price and tax using its own prices
        for (const linkedAmenity of linkedAmenities) {
          // Adjust service charge rate for inclusive settings
          let svcChargeRate = serviceChargeRate;
          if (hotel.serviceChargeSetting === ServiceChargeSettingEnum.INCLUSIVE) {
            svcChargeRate = 0;
          }

          // for combo, we need to get tax settings for each linked amenity
          const taxSettings = linkedAmenity.taxSettingList ?? [];

          // Calculate pricing for this linked amenity using its own prices
          // Each sub-service uses its own hotelAmenityPrices, not allocated from parent
          const amenityPricing = this.calculateAmenityPricingDetails(
            linkedAmenity,
            input,
            hotelConfigRoundingMode
          );

          // Use the linked amenity's own calculated selling price
          // This is the SELLING PRICE from the linked amenity's hotelAmenityPrices
          const subTotalSellingRate = amenityPricing.totalPrice ?? new Decimal(0);
          const subTotalSellingRateBeforeAdjustment =
            amenityPricing.totalPriceBeforeAdjustment ?? new Decimal(0);
          dailyPricingList = amenityPricing.dailyPricingList ?? [];
          ageCategoryPricingList = amenityPricing.ageCategoryPricingList ?? [];
          count = amenityPricing.count ?? 0;

          // Calculate tax and service charges based on hotel tax setting
          // Uses the linked amenity's own selling price, not an allocated price
          const taxResult = this.calculateTaxAndServiceCharges(
            linkedAmenity,
            subTotalSellingRate,
            subTotalSellingRateBeforeAdjustment,
            svcChargeRate,
            serviceChargeTaxRate,
            taxSettings, // Use sub-service tax settings
            fromDate,
            toDate,
            hotel.taxSetting,
            decimalUnits,
            roundingMode,
            taxDetailsMap
          );

          this.setAmenityFields(
            linkedAmenity,
            taxResult,
            dailyPricingList,
            ageCategoryPricingList,
            count
          );

          // Store in linkedAmenityInfoList for PMS posting
          hotelAmenity.linkedAmenityInfoList.push(linkedAmenity);

          // Aggregate totals from all sub-services
          this.aggregateTotals(taxResult, totals);
        }

        // Extract values from totals object
        totalBaseAmount = totals.totalBaseAmount;
        totalBaseAmountBeforeAdjustment = totals.totalBaseAmountBeforeAdjustment;
        taxAmount = totals.taxAmount;
        taxAmountBeforeAdjustment = totals.taxAmountBeforeAdjustment;
        serviceChargeAmount = totals.serviceChargeAmount;
        serviceChargeAmountBeforeAdjustment = totals.serviceChargeAmountBeforeAdjustment;
        totalSellingRate = totals.totalSellingRate;
        totalGrossAmount = totals.totalGrossAmount;
        totalGrossAmountBeforeAdjustment = totals.totalGrossAmountBeforeAdjustment;

        const averageDailyRate = totalSellingRate
          .dividedBy(losDecimal)
          .toDecimalPlaces(decimalUnits, roundingMode);

        // Set final results on hotelAmenity
        this.setAmenityCalculationResults(hotelAmenity, {
          totalSellingRate,
          totalBaseAmount,
          totalBaseAmountBeforeAdjustment,
          serviceChargeAmount,
          serviceChargeAmountBeforeAdjustment,
          taxAmount,
          taxAmountBeforeAdjustment,
          totalGrossAmount,
          totalGrossAmountBeforeAdjustment,
          averageDailyRate,
          dailyPricingList,
          ageCategoryPricingList,
          count,
          taxDetailsMap
        });
      } catch (error) {
        this.logger.error(
          `Error processing COMBO ${hotelAmenity.code}: ${error.message}`,
          error.stack
        );
        throw error;
      }
    } else {
      // NON-COMBO flow
      const amenityPricing = this.calculateAmenityPricingDetails(
        hotelAmenity,
        input,
        hotelConfigRoundingMode
      );

      // The totalPrice from amenityPricing is the SELLING PRICE
      // We need to interpret this based on hotel tax setting:
      // - INCLUSIVE: selling price = gross amount (includes all taxes)
      // - EXCLUSIVE: selling price = base amount (before taxes)
      totalSellingRate = amenityPricing.totalPrice ?? new Decimal(0); // This is selling price
      totalSellingRateBeforeAdjustment =
        amenityPricing.totalPriceBeforeAdjustment ?? new Decimal(0);
      dailyPricingList = amenityPricing.dailyPricingList ?? [];
      ageCategoryPricingList = amenityPricing.ageCategoryPricingList ?? [];
      count = amenityPricing.count ?? 0;

      let svcChargeRate = serviceChargeRate;
      if (hotel.serviceChargeSetting === ServiceChargeSettingEnum.INCLUSIVE) {
        svcChargeRate = 0;
      }

      // console.log('taxDetailsMap', taxDetailsMap);
      const taxResult = this.calculateTaxAndServiceCharges(
        hotelAmenity,
        totalSellingRate, // Pass selling price to tax calculation
        totalSellingRateBeforeAdjustment,
        svcChargeRate,
        serviceChargeTaxRate,
        taxSettingList,
        fromDate,
        toDate,
        hotel.taxSetting,
        decimalUnits,
        roundingMode,
        taxDetailsMap
      );

      totalBaseAmount = taxResult.totalBaseAmount;
      totalBaseAmountBeforeAdjustment = taxResult.totalBaseAmountBeforeAdjustment;

      taxAmount = taxResult.taxAmount;

      taxAmountBeforeAdjustment = taxResult.taxAmountBeforeAdjustment;
      serviceChargeAmount = taxResult.serviceChargeAmount;
      serviceChargeAmountBeforeAdjustment = taxResult.serviceChargeAmountBeforeAdjustment;
      totalGrossAmount = taxResult.totalGrossAmount;
      totalGrossAmountBeforeAdjustment = taxResult.totalGrossAmountBeforeAdjustment;
    }

    // Calculate average daily rate
    const averageDailyRate = totalSellingRate
      .dividedBy(losDecimal)
      .toDecimalPlaces(decimalUnits, roundingMode);

    // Set final results on hotelAmenity
    this.setAmenityCalculationResults(hotelAmenity, {
      totalSellingRate,
      totalBaseAmount,
      totalBaseAmountBeforeAdjustment,
      serviceChargeAmount,
      serviceChargeAmountBeforeAdjustment,
      taxAmount,
      taxAmountBeforeAdjustment,
      totalGrossAmount,
      totalGrossAmountBeforeAdjustment,
      averageDailyRate,
      dailyPricingList,
      ageCategoryPricingList,
      count,
      taxDetailsMap
    });

    return hotelAmenity;
  }

  /**
   * Calculate detailed amenity pricing including age categories and daily breakdown
   * Note: Prices in hotelAmenityPrices are SELLING PRICES, not base prices
   */
  private calculateAmenityPricingDetails(
    hotelAmenity: HotelAmenity,
    input: CalculatePricingAmenityInput,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number }
  ): Partial<HotelAmenity> {
    const defaultAgeCategoryCode = HotelAgeCategoryCodeEnum.DEFAULT;
    const defaultAmenityPrice = this.getAmenityPrice(hotelAmenity, defaultAgeCategoryCode);

    const fromDate = input.fromDate;
    const childrenAgeList = input.childrenAgeList ?? [];
    const adult = input.adult ?? 1;
    const allocatedPets = input.allocatedPets ?? 0;

    const hotelAmenityPricingByAgeCategories: HotelAmenityAgeCategoryPricingDto[] = [];

    // Handle person-based pricing with age categories
    if (
      hotelAmenity.pricingUnit === PricingUnitEnum.PER_PERSON_PER_ROOM ||
      hotelAmenity.pricingUnit === PricingUnitEnum.PERSON
    ) {
      const priceEntries = hotelAmenity.hotelAmenityPrices ?? [];

      for (const p of priceEntries) {
        const cat = p.hotelAgeCategory;
        if (!cat || cat.code === defaultAgeCategoryCode) continue;

        const fromAge = cat.fromAge ?? 0;
        const toAge = cat.toAge ?? 200;
        const childCount = childrenAgeList.filter((age) => age >= fromAge && age <= toAge).length;

        if (childCount > 0) {
          hotelAmenityPricingByAgeCategories.push({
            ageCategoryCode: cat.code,
            fromAge: fromAge,
            toAge: toAge,
            dailyCount: childCount,
            dailyPrice: new Decimal(p.price ?? 0),
            totalCount: 0,
            totalPrice: new Decimal(0)
          });
        }
      }
    }

    // Calculate daily count based on pricing unit
    let dailyCount = 0;
    const isPetSurcharge = this.isPetAmenity(hotelAmenity);
    const totalAdultsAndChildren = childrenAgeList.length + adult;
    const petSurchargeCount = allocatedPets;

    switch (hotelAmenity.pricingUnit) {
      case PricingUnitEnum.ITEM:
        dailyCount = hotelAmenity.count && hotelAmenity.count > 0 ? hotelAmenity.count : 1;
        break;
      case PricingUnitEnum.ROOM:
      case PricingUnitEnum.NIGHT:
        dailyCount = 1;
        break;
      case PricingUnitEnum.PERSON:
      case PricingUnitEnum.PER_PERSON_PER_ROOM:
        dailyCount = isPetSurcharge ? petSurchargeCount : totalAdultsAndChildren;
        break;
      case PricingUnitEnum.STAY:
        dailyCount = 1;
        break;
      default:
        dailyCount = 1;
        break;
    }

    // Add default category for remaining adults/general pricing
    if (dailyCount > 0) {
      const defaultDto: HotelAmenityAgeCategoryPricingDto = {
        ageCategoryCode: defaultAgeCategoryCode,
        dailyCount: 0,
        dailyPrice: defaultAmenityPrice,
        totalCount: 0,
        totalPrice: new Decimal(0),
        fromAge: null,
        toAge: null
      };

      if (isPetSurcharge) {
        defaultDto.dailyCount = dailyCount;
      } else {
        // TODO: Handle children with specific pricing
        const childrenWithSpecificPricing = hotelAmenityPricingByAgeCategories.reduce(
          (sum, cat) => sum + (cat?.dailyCount ?? 0),
          0
        );
        const adultsAndRemainingChildren = totalAdultsAndChildren - childrenWithSpecificPricing;
        defaultDto.dailyCount = Math.max(0, adultsAndRemainingChildren);
      }

      hotelAmenityPricingByAgeCategories.push(defaultDto);
    }

    // Calculate per-date price using selling prices
    // Note: The dailyPrice is the SELLING PRICE from hotelAmenityPrices
    let amenitySellingPricePerDate = new Decimal(0);
    for (const ageCategory of hotelAmenityPricingByAgeCategories) {
      const perDateRate = this.calculatePerDateServiceRate(
        hotelAmenity,
        ageCategory.dailyPrice ?? new Decimal(0), // This is selling price
        ageCategory.dailyCount ?? 0
      );
      amenitySellingPricePerDate = amenitySellingPricePerDate.plus(perDateRate);
    }

    // Determine service dates

    const serviceDates = this.getServiceDates(hotelAmenity, fromDate);

    // Create daily breakdown using selling prices
    const dailyPricingList = this.breakdownDailyAmenityPricing(
      hotelAmenity.pricingUnit ?? PricingUnitEnum.ITEM,
      amenitySellingPricePerDate,
      dailyCount,
      serviceDates,
      fromDate,
      input.toDate,
      input.includedDates ?? [],
      hotelConfigRoundingMode,
      hotelAmenity.availability
    );

    const totalNightAmenitySellingPrice = dailyPricingList.reduce(
      (sum, daily) => sum.plus(daily.price),
      new Decimal(0)
    );
    const totalCount = dailyPricingList.reduce((sum, daily) => sum + daily.count, 0);

    // Update age category totals
    this.computeTotalAgeCategoryPrice(hotelAmenity, hotelAmenityPricingByAgeCategories, totalCount);

    return {
      basePrice: amenitySellingPricePerDate,
      totalPrice: totalNightAmenitySellingPrice, // This is selling price, not base price
      totalPriceBeforeAdjustment: totalNightAmenitySellingPrice,
      dailyPricingList,
      count: totalCount,
      ageCategoryPricingList: hotelAmenityPricingByAgeCategories
    };
  }

  /**
   * Calculate tax and service charges based on hotel settings (inclusive/exclusive)
   */
  private calculateTaxAndServiceCharges(
    amenity: HotelAmenity,
    totalSellingRate: Decimal,
    totalSellingRateBeforeAdjustment: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxSettingList: any[],
    fromDate: string,
    toDate: string,
    taxSetting: TaxSettingEnum,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    taxDetailsMap: Record<string, Decimal>
  ) {
    if (taxSetting === TaxSettingEnum.INCLUSIVE) {
      return this.calculateInclusiveTax(
        amenity,
        totalSellingRate,
        totalSellingRateBeforeAdjustment,
        serviceChargeRate,
        serviceChargeTaxRate,
        taxSettingList,
        fromDate,
        toDate,
        decimalUnits,
        roundingMode,
        taxDetailsMap
      );
    } else {
      return this.calculateInclusiveTax(
        amenity,
        totalSellingRate,
        totalSellingRateBeforeAdjustment,
        serviceChargeRate,
        serviceChargeTaxRate,
        taxSettingList,
        fromDate,
        toDate,
        decimalUnits,
        roundingMode,
        taxDetailsMap
      );
    }
  }

  /**
   * Calculate inclusive tax (tax is included in the gross amount)
   * In inclusive mode: totalSellingRate IS the gross amount (includes base + service charge + tax)
   */
  private calculateInclusiveTax(
    amenity: HotelAmenity,
    totalSellingRate: Decimal, // This is gross amount in inclusive mode
    totalSellingRateBeforeAdjustment: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxSettingList: any[],
    fromDate: string,
    toDate: string,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    taxDetailsMap: Record<string, Decimal>
  ) {
    const totalGrossAmount = totalSellingRate; // Selling rate = gross amount in inclusive mode
    const totalGrossAmountBeforeAdjustment = totalSellingRateBeforeAdjustment;

    // Split amounts across dates for daily tax calculation
    const grossDays = this.splitAcrossDates(
      fromDate,
      toDate,
      totalGrossAmount,
      decimalUnits,
      roundingMode
    );
    const grossDaysBefore = this.splitAcrossDates(
      fromDate,
      toDate,
      totalGrossAmountBeforeAdjustment,
      decimalUnits,
      roundingMode
    );

    let totalBaseAmount = new Decimal(0);
    let totalBaseAmountBeforeAdjustment = new Decimal(0);

    for (let i = 0; i < grossDays.length; i++) {
      const grossAmount = grossDays[i];
      const grossAmountBefore = grossDaysBefore[i];

      const appliedTaxList = this.getApplicableTaxes(taxSettingList, amenity.code, fromDate, i);
      const taxRate = appliedTaxList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);

      const baseAmount = this.calculateBaseAmountFromInclusive(
        grossAmount,
        serviceChargeRate,
        taxRate,
        serviceChargeTaxRate
      );
      const baseAmountBefore = this.calculateBaseAmountFromInclusive(
        grossAmountBefore,
        serviceChargeRate,
        taxRate,
        serviceChargeTaxRate
      );

      totalBaseAmount = totalBaseAmount.plus(baseAmount);
      totalBaseAmountBeforeAdjustment = totalBaseAmountBeforeAdjustment.plus(baseAmountBefore);

      // Calculate tax breakdown for this day
      const serviceCharge = this.calculateServiceCharge(
        baseAmount,
        serviceChargeRate,
        decimalUnits,
        roundingMode
      );
      const taxAmount = this.calculateTaxInclusiveForDay(
        grossAmount,
        serviceCharge,
        baseAmount,
        decimalUnits,
        roundingMode
      );

      this.distributeTaxAmountByCode(appliedTaxList, taxAmount, taxDetailsMap);
    }

    const taxAmount = this.calculateTaxInclusiveForTotals(
      totalGrossAmount,
      serviceChargeRate,
      totalBaseAmount,
      decimalUnits,
      roundingMode,
      serviceChargeTaxRate
    );
    const taxAmountBeforeAdjustment = this.calculateTaxInclusiveForTotals(
      totalGrossAmountBeforeAdjustment,
      serviceChargeRate,
      totalBaseAmountBeforeAdjustment,
      decimalUnits,
      roundingMode,
      serviceChargeTaxRate
    );

    const serviceChargeAmount = this.calculateServiceCharge(
      totalBaseAmount,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );
    const serviceChargeAmountBeforeAdjustment = this.calculateServiceCharge(
      totalBaseAmountBeforeAdjustment,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );

    return {
      totalBaseAmount,
      totalBaseAmountBeforeAdjustment,
      taxAmount,
      taxAmountBeforeAdjustment,
      serviceChargeAmount,
      serviceChargeAmountBeforeAdjustment,
      totalSellingRate,
      totalGrossAmount,
      totalGrossAmountBeforeAdjustment
    };
  }

  /**
   * Calculate exclusive tax (tax is added to the base amount)
   * In exclusive mode: totalSellingRate IS the base amount (before tax and service charges)
   */
  private calculateExclusiveTax(
    amenity: HotelAmenity,
    totalSellingRate: Decimal, // This is base amount in exclusive mode
    totalSellingRateBeforeAdjustment: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxSettingList: any[],
    fromDate: string,
    toDate: string,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    taxDetailsMap: Record<string, Decimal>
  ) {
    const totalBaseAmount = totalSellingRate; // Selling rate = base amount in exclusive mode
    const totalBaseAmountBeforeAdjustment = totalSellingRateBeforeAdjustment;

    const serviceChargeAmount = this.calculateServiceCharge(
      totalBaseAmount,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );
    const serviceChargeAmountBeforeAdjustment = this.calculateServiceCharge(
      totalBaseAmountBeforeAdjustment,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );

    // Split base amounts across dates for daily tax calculation
    const baseDays = this.splitAcrossDates(
      fromDate,
      toDate,
      totalBaseAmount,
      decimalUnits,
      roundingMode
    );
    const baseDaysBefore = this.splitAcrossDates(
      fromDate,
      toDate,
      totalBaseAmountBeforeAdjustment,
      decimalUnits,
      roundingMode
    );

    let taxAmount = new Decimal(0);
    let taxAmountBeforeAdjustment = new Decimal(0);

    for (let i = 0; i < baseDays.length; i++) {
      const baseAmount = baseDays[i];
      const baseAmountBefore = baseDaysBefore[i];

      const appliedTaxList = this.getApplicableTaxes(taxSettingList, amenity.code, fromDate, i);

      const taxAmountByCode = this.calculateTaxAmountExclusiveProperty(
        appliedTaxList,
        baseAmount,
        serviceChargeRate,
        serviceChargeTaxRate,
        decimalUnits,
        roundingMode
      );
      const taxAmountBeforeByCode = this.calculateTaxAmountExclusiveProperty(
        appliedTaxList,
        baseAmountBefore,
        serviceChargeRate,
        serviceChargeTaxRate,
        decimalUnits,
        roundingMode
      );

      const dailyTaxAmount = Object.values(taxAmountByCode).reduce(
        (sum, amt) => sum.plus(amt),
        new Decimal(0)
      );
      const dailyTaxAmountBefore = Object.values(taxAmountBeforeByCode).reduce(
        (sum, amt) => sum.plus(amt),
        new Decimal(0)
      );

      taxAmount = taxAmount.plus(dailyTaxAmount);
      taxAmountBeforeAdjustment = taxAmountBeforeAdjustment.plus(dailyTaxAmountBefore);

      // Add to tax details map
      for (const [taxCode, amount] of Object.entries(taxAmountByCode)) {
        taxDetailsMap[taxCode] = (taxDetailsMap[taxCode] ?? new Decimal(0)).plus(amount);
      }
    }

    const totalGrossAmount = this.calculateGrossExclusive(
      totalBaseAmount,
      serviceChargeAmount,
      taxAmount,
      decimalUnits,
      roundingMode
    );
    const totalGrossAmountBeforeAdjustment = this.calculateGrossExclusive(
      totalBaseAmountBeforeAdjustment,
      serviceChargeAmountBeforeAdjustment,
      taxAmountBeforeAdjustment,
      decimalUnits,
      roundingMode
    );

    return {
      totalBaseAmount,
      totalBaseAmountBeforeAdjustment,
      taxAmount,
      taxAmountBeforeAdjustment,
      serviceChargeAmount,
      serviceChargeAmountBeforeAdjustment,
      totalSellingRate,
      totalGrossAmount,
      totalGrossAmountBeforeAdjustment
    };
  }

  // ---------- Helper methods ----------

  /**
   * Get linked amenities for a COMBO amenity by querying database
   * Includes validation for missing, inactive, and circular references
   * @param amenity - The parent COMBO amenity
   * @param hotelId - Hotel ID to filter amenities
   * @returns Array of linked amenity entities
   * @throws Error if validation fails critically
   */
  private async getLinkedAmenities(
    amenity: HotelAmenity,
    hotelId: string
  ): Promise<HotelAmenity[]> {
    if (!amenity.linkedAmenityCode) {
      this.logger.warn(`COMBO amenity ${amenity.code} has no linkedAmenityCode configured`);
      return [];
    }

    // Parse comma-separated codes
    const codes = amenity.linkedAmenityCode
      .split(',')
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    if (codes.length === 0) {
      this.logger.warn(`COMBO amenity ${amenity.code} has empty linkedAmenityCode after parsing`);
      return [];
    }

    // Check for duplicate codes
    const uniqueCodes = [...new Set(codes)];
    if (uniqueCodes.length !== codes.length) {
      this.logger.warn(`COMBO amenity ${amenity.code} has duplicate codes in linkedAmenityCode`);
    }

    // for linked, we need to get hotel tax settings for each linked amenity

    try {
      // Query linked amenities (including inactive ones for validation)
      const [allLinkedAmenities, allLinkedTaxSettings] = await Promise.all([
        this.hotelAmenityRepository.find({
          where: {
            hotelId,
            code: In(uniqueCodes)
          },
          relations: {
            hotelAmenityPrices: {
              hotelAgeCategory: true
            }
          }
        }),

        this.hotelTaxSettingRepository.find({
          where: {
            hotelId,
            serviceCode: In(uniqueCodes)
          },
          relations: {
            hotelTax: true
          }
        })
      ]);

      // link tax settings to linked amenities
      for (const linkedAmenity of allLinkedAmenities) {
        const linkedTaxSettings = allLinkedTaxSettings.filter(
          (taxSetting) => taxSetting.serviceCode === linkedAmenity.code
        );
        linkedAmenity.taxSettingList = linkedTaxSettings;
      }

      // Separate active and inactive
      const activeLinkedAmenities = allLinkedAmenities.filter(
        (a) => a.status === AmenityStatusEnum.ACTIVE
      );
      const inactiveLinkedAmenities = allLinkedAmenities.filter(
        (a) => a.status !== AmenityStatusEnum.ACTIVE
      );

      // Validate all codes were found
      const foundCodes = new Set(allLinkedAmenities.map((a) => a.code));
      const missingCodes = uniqueCodes.filter((code) => !foundCodes.has(code));

      // Validation: Missing codes
      if (missingCodes.length > 0) {
        const errorMsg = `COMBO ${amenity.code}: Linked amenity codes not found: ${missingCodes.join(', ')}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Validation: Inactive amenities
      if (inactiveLinkedAmenities.length > 0) {
        const inactiveCodes = inactiveLinkedAmenities.map((a) => a.code).join(', ');
        const errorMsg = `COMBO ${amenity.code}: Linked amenities are inactive: ${inactiveCodes}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Validation: Circular references (check if any linked amenity is also a COMBO that links back)
      for (const linkedAmenity of activeLinkedAmenities) {
        if (linkedAmenity.sellingType === SellingTypeEnum.COMBO) {
          if (linkedAmenity.linkedAmenityCode?.includes(amenity.code)) {
            const errorMsg = `COMBO ${amenity.code}: Circular reference detected - linked amenity ${linkedAmenity.code} also links back to ${amenity.code}`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
          }
        }
      }

      return activeLinkedAmenities;
    } catch (error) {
      if (error instanceof Error && error.message.includes('COMBO')) {
        // Re-throw validation errors
        throw error;
      }
      this.logger.error(
        `Error fetching linked amenities for COMBO ${amenity.code}: ${error.message}`,
        error.stack
      );
      throw new Error(
        `Failed to fetch linked amenities for COMBO ${amenity.code}: ${error.message}`
      );
    }
  }

  /**
   * Allocate parent COMBO price among linked amenities based on their individual prices
   * Allocation is proportional to each linked service's total price
   * Ensures total allocated price matches parent price exactly using rounding
   * @param parentSellingPrice - The parent COMBO's selling price
   * @param linkedAmenities - Array of linked amenity entities
   * @param linkedAmenityPrices - Map of linked amenity codes to their calculated prices
   * @param totalLinkedPrice - Sum of all linked amenity prices
   * @param decimalUnits - Number of decimal places for rounding
   * @param roundingMode - Rounding mode to use
   * @returns Map of amenity code to allocated price
   */
  private allocateComboPrice(
    parentSellingPrice: Decimal,
    linkedAmenities: HotelAmenity[],
    linkedAmenityPrices: Map<string, Decimal>,
    totalLinkedPrice: Decimal,
    decimalUnits: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Map<string, Decimal> {
    const allocation = new Map<string, Decimal>();

    if (linkedAmenities.length === 0) {
      return allocation;
    }

    // If total linked price is zero or very small, fallback to equal split
    if (totalLinkedPrice.lte(0) || totalLinkedPrice.lt(new Decimal(0.01))) {
      this.logger.warn(
        `Total linked amenity price is zero or very small (${totalLinkedPrice.toFixed(2)}). Falling back to equal split.`
      );

      const pricePerAmenity = parentSellingPrice
        .dividedBy(linkedAmenities.length)
        .toDecimalPlaces(decimalUnits, roundingMode);

      let totalAllocated = new Decimal(0);
      for (let i = 0; i < linkedAmenities.length; i++) {
        const amenity = linkedAmenities[i];
        // Last amenity gets remaining amount to ensure exact match
        if (i === linkedAmenities.length - 1) {
          const remaining = parentSellingPrice.minus(totalAllocated);
          allocation.set(amenity.code, remaining.toDecimalPlaces(decimalUnits, roundingMode));
        } else {
          allocation.set(amenity.code, pricePerAmenity);
          totalAllocated = totalAllocated.plus(pricePerAmenity);
        }
      }
      return allocation;
    }

    // Allocate proportionally based on each linked amenity's price
    let totalAllocated = new Decimal(0);
    for (let i = 0; i < linkedAmenities.length; i++) {
      const amenity = linkedAmenities[i];
      const linkedPrice = linkedAmenityPrices.get(amenity.code) || new Decimal(0);

      // Calculate proportion
      const proportion = linkedPrice.dividedBy(totalLinkedPrice);

      // Allocate based on proportion
      let allocatedPrice: Decimal;
      if (i === linkedAmenities.length - 1) {
        // Last amenity gets remaining amount to ensure exact match
        allocatedPrice = parentSellingPrice.minus(totalAllocated);
      } else {
        allocatedPrice = parentSellingPrice
          .times(proportion)
          .toDecimalPlaces(decimalUnits, roundingMode);
        totalAllocated = totalAllocated.plus(allocatedPrice);
      }

      allocation.set(amenity.code, allocatedPrice);
    }

    // Validate total matches (should be exact due to last-item adjustment)
    const finalTotal = Array.from(allocation.values()).reduce(
      (sum, price) => sum.plus(price),
      new Decimal(0)
    );
    const difference = parentSellingPrice.minus(finalTotal);

    if (difference.abs().gt(new Decimal(0.01))) {
      this.logger.warn(
        `Price allocation mismatch after proportional allocation. Parent: ${parentSellingPrice.toFixed(2)}, Allocated: ${finalTotal.toFixed(2)}, Difference: ${difference.toFixed(2)}`
      );
    }

    return allocation;
  }

  private inheritParentProperties(linkedAmenity: HotelAmenity, parentAmenity: HotelAmenity): void {
    (linkedAmenity as any).includedDates = (parentAmenity as any).includedDates;
    (linkedAmenity as any).serviceDates = (parentAmenity as any).serviceDates;
    (linkedAmenity as any).isSalesPlanIncluded = (parentAmenity as any).isSalesPlanIncluded;
  }

  private isPetAmenity(amenity: HotelAmenity): boolean {
    return (
      (amenity.code ?? '').toUpperCase().includes('PET') ||
      amenity.code === HotelAmenityCodeSurchargeEnum.PET_AMENITY_CODE
    );
  }

  /**
   * Get amenity selling price for a specific age category
   * Note: The price in hotelAmenityPrices is the SELLING PRICE, not base price
   */
  private getAmenityPrice(amenity: HotelAmenity, ageCategoryCode: string): Decimal {
    const prices = amenity.hotelAmenityPrices ?? [];
    for (const price of prices) {
      if (price.hotelAgeCategory && price.hotelAgeCategory.code === ageCategoryCode) {
        return new Decimal(price.price ?? 0);
      }
    }
    // Fallback to base rate (also treated as selling price)
    return new Decimal(amenity.baseRate ?? 0);
  }

  /**
   * Convert selling price to base amount based on hotel tax setting
   * If hotel uses INCLUSIVE tax: selling price = gross amount, need to calculate base
   * If hotel uses EXCLUSIVE tax: selling price = base amount, use as-is
   */
  private convertSellingPriceToBaseAmount(
    sellingPrice: Decimal,
    hotelTaxSetting: TaxSettingEnum,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxRate: number,
    decimalPlaces: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    if (hotelTaxSetting === TaxSettingEnum.INCLUSIVE) {
      // Selling price is gross amount, need to extract base
      return TaxInclusiveUtils.calculateBaseAmountFromInclusive(
        sellingPrice,
        serviceChargeRate,
        serviceChargeTaxRate,
        taxRate,
        decimalPlaces,
        roundingMode
      );
    } else {
      // Selling price is base amount, use as-is
      return sellingPrice;
    }
  }

  private calculatePerDateServiceRate(
    amenity: HotelAmenity,
    price: Decimal,
    personCount: number
  ): Decimal {
    const amenityCount =
      (amenity as any).count && (amenity as any).count > 0 ? (amenity as any).count : 1;

    if (
      amenity.pricingUnit === PricingUnitEnum.PERSON ||
      amenity.pricingUnit === PricingUnitEnum.PER_PERSON_PER_ROOM
    ) {
      return price.times(personCount);
    }

    return price.times(amenityCount);
  }

  private getServiceDates(amenity: HotelAmenity, fromDate: string): Set<string> {
    const isSalesPlanIncluded = (amenity as any).isSalesPlanIncluded;
    const includedDates = (amenity as any).includedDates;
    const serviceDates = (amenity as any).serviceDates;

    if (isSalesPlanIncluded) {
      if (!includedDates || includedDates.size === 0) {
        return new Set([fromDate]);
      }
      return includedDates;
    }

    return serviceDates ?? new Set([fromDate]);
  }

  private breakdownDailyAmenityPricing(
    pricingUnit: PricingUnitEnum,
    price: Decimal,
    count: number,
    dateSet: Set<string>,
    arrivalDate: string,
    toDate: string,
    includeDateList: string[],
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    availableMode?: AmenityAvailabilityEnum
  ): HotelAmenityPricingDailyDto[] {
    const decimalUnits = hotelConfigRoundingMode.decimalPlaces;
    const roundingMode = this.mapRoundingMode(hotelConfigRoundingMode.roundingMode);

    if (pricingUnit === PricingUnitEnum.PERSON || pricingUnit === PricingUnitEnum.NIGHT) {
      // For PERSON and NIGHT pricing, distribute across all nights
      let dates = this.getDateRangeInclusive(arrivalDate, toDate);

      if (includeDateList.length > 0) {
        dates = dates.filter((date) => includeDateList.includes(date));
      }

      return dates.map((date) => ({
        date,
        price: this.roundDecimal(price, decimalUnits, roundingMode),
        count
      }));
    }

    // else if (
    //   [PricingUnitEnum.ROOM, PricingUnitEnum.PER_PERSON_PER_ROOM, PricingUnitEnum.ITEM].includes(
    //     pricingUnit
    //   ) &&
    //   availableMode
    // ) {
    //   // Check available mode if have:
    //   switch (availableMode) {
    //     case AmenityAvailabilityEnum.ONLY_ON_ARRIVAL:
    //       return [
    //         {
    //           date: arrivalDate,
    //           price: this.roundDecimal(price, decimalUnits, roundingMode),
    //           count
    //         }
    //       ];

    //     case AmenityAvailabilityEnum.ONLY_ON_DEPARTURE:
    //       return [
    //         {
    //           date: toDate,
    //           price: this.roundDecimal(price, decimalUnits, roundingMode),
    //           count
    //         }
    //       ];

    //     default:
    //       // For PERSON and NIGHT pricing, distribute across all nights
    //       let dates = this.getDateRangeInclusive(arrivalDate, toDate);

    //       if (includeDateList.length > 0) {
    //         dates = dates.filter((date) => includeDateList.includes(date));
    //       }

    //       return dates.map((date) => ({
    //         date,
    //         price: this.roundDecimal(price, decimalUnits, roundingMode),
    //         count
    //       }));
    //       break;
    //   }
    // }

    // Single-date pricing (ITEM, STAY, ROOM) - assign to first night
    return [
      {
        date: arrivalDate,
        price: this.roundDecimal(price, decimalUnits, roundingMode),
        count
      }
    ];
  }

  private computeTotalAgeCategoryPrice(
    amenity: HotelAmenity,
    ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[],
    totalAmenityCount: number
  ): void {
    const dailyAmenityCount = ageCategoryPricingList.reduce(
      (sum, cat) => sum + (cat?.dailyCount ?? 0),
      0
    );

    if (dailyAmenityCount === 0 || totalAmenityCount === 0) return;

    const multiplier = Math.floor(totalAmenityCount / dailyAmenityCount);

    for (const ageCategory of ageCategoryPricingList) {
      let dailyPrice = ageCategory.dailyPrice;
      const dailyCount = ageCategory.dailyCount;

      if (
        amenity.pricingUnit === PricingUnitEnum.PERSON ||
        amenity.pricingUnit === PricingUnitEnum.PER_PERSON_PER_ROOM
      ) {
        dailyPrice = dailyPrice?.times(dailyCount ?? 0) ?? new Decimal(0);
      }

      ageCategory.totalPrice = dailyPrice?.times(multiplier) ?? new Decimal(0);
      ageCategory.totalCount = (dailyCount ?? 0) * multiplier;
    }
  }

  // ---------- Tax calculation utilities ----------

  private calculateBaseAmountFromInclusive(
    grossAmount: Decimal,
    serviceChargeRate: number,
    taxRate: number,
    serviceChargeTaxRate: number
  ): Decimal {
    const s = new Decimal(serviceChargeRate);
    const t = new Decimal(taxRate);
    const st = new Decimal(serviceChargeTaxRate);
    const denominator = new Decimal(1).plus(s).plus(t).plus(s.times(st));

    if (denominator.equals(0)) return new Decimal(0);

    // grossAmount * tax rate => tax amount
    // base = grossAmount - tax amount

    return grossAmount.minus(grossAmount.times(taxRate));
  }

  private calculateServiceCharge(
    baseAmount: Decimal,
    serviceChargeRate: number,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    return this.roundDecimal(baseAmount.times(serviceChargeRate), decimalUnits, roundingMode);
  }

  private calculateTaxInclusiveForDay(
    grossAmount: Decimal,
    serviceChargeAmount: Decimal,
    baseAmount: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    const taxAmount = grossAmount.minus(baseAmount).minus(serviceChargeAmount);
    return this.roundDecimal(taxAmount, decimalUnits, roundingMode);
  }

  private calculateTaxInclusiveForTotals(
    grossTotal: Decimal,
    serviceChargeRate: number,
    baseTotal: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    serviceChargeTaxRate: number
  ): Decimal {
    const serviceChargeAmount = this.calculateServiceCharge(
      baseTotal,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );
    const taxAmount = grossTotal.minus(baseTotal).minus(serviceChargeAmount);
    return this.roundDecimal(taxAmount, decimalUnits, roundingMode);
  }

  private calculateTaxAmountExclusiveProperty(
    appliedTaxList: any[],
    baseAmount: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Record<string, Decimal> {
    const totalTaxRate = appliedTaxList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);

    if (totalTaxRate === 0) return {};

    const baseTax = baseAmount.times(totalTaxRate);
    const serviceChargeAmount = baseAmount.times(serviceChargeRate);
    const serviceChargeTax = serviceChargeAmount.times(serviceChargeTaxRate);
    const totalTax = baseTax.plus(serviceChargeTax);

    const result: Record<string, Decimal> = {};

    for (const tax of appliedTaxList) {
      const taxCode = tax.taxCode;
      const taxRate = tax.hotelTax?.rate ?? 0;
      const proportion = new Decimal(taxRate).dividedBy(totalTaxRate);
      const amount = totalTax.times(proportion);
      result[taxCode] = this.roundDecimal(amount, decimalUnits, roundingMode);
    }

    return result;
  }

  private calculateGrossExclusive(
    baseAmount: Decimal,
    serviceChargeAmount: Decimal,
    taxAmount: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    return this.roundDecimal(
      baseAmount.plus(serviceChargeAmount).plus(taxAmount),
      decimalUnits,
      roundingMode
    );
  }

  // ---------- Utility methods ----------

  private splitAcrossDates(
    fromDateIso: string,
    toDateIso: string,
    total: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal[] {
    const dates = this.getDateRangeInclusive(fromDateIso, toDateIso);
    const numDates = dates.length;

    if (numDates === 0) return [];
    if (numDates === 1) return [total];

    const perDate = total.dividedBy(numDates).toDecimalPlaces(decimalUnits, roundingMode);
    const amounts: Decimal[] = new Array(numDates).fill(perDate);

    // Add remainder to last date
    const sum = amounts.reduce((acc, amt) => acc.plus(amt), new Decimal(0));
    const remainder = total.minus(sum);
    amounts[numDates - 1] = amounts[numDates - 1].plus(remainder);

    return amounts;
  }

  private getDateRangeInclusive(fromIso: string, toIso: string): string[] {
    const dates: string[] = [];
    const fromDate = new Date(fromIso + 'T00:00:00Z');
    const toDate = new Date(toIso + 'T00:00:00Z');

    for (let d = new Date(fromDate); d <= toDate; d.setUTCDate(d.getUTCDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }

    return dates;
  }

  private getApplicableTaxes(
    taxSettingList: any[],
    serviceCode: string,
    baseDate: string,
    dayIndex: number
  ): any[] {
    // Calculate the actual date for this day
    const baseDateObj = new Date(baseDate + 'T00:00:00Z');
    const currentDate = new Date(baseDateObj);
    currentDate.setUTCDate(currentDate.getUTCDate() + dayIndex);
    const currentDateIso = currentDate.toISOString().slice(0, 10);

    return taxSettingList.filter((tax) => {
      // Filter by service code if applicable
      if (serviceCode && tax.serviceCode && tax.serviceCode !== serviceCode) {
        return false;
      }

      // Check date validity for this tax setting
      return this.isValidDailyHotelTax(tax, currentDateIso);
    });
  }

  /**
   * Validate if a tax setting is valid for the given date
   * Checks if the date falls within the validFrom and validTo range of the associated HotelTax
   * @param taxSetting - The tax setting to validate
   * @param dateIso - The date to check in ISO format (YYYY-MM-DD)
   * @returns true if the tax setting is valid for the date, false otherwise
   */
  private isValidDailyHotelTax(taxSetting: any, dateIso: string): boolean {
    // If no hotelTax relation, assume valid (backward compatibility)
    if (!taxSetting.hotelTax) {
      return true;
    }

    const hotelTax = taxSetting.hotelTax;
    const checkDate = new Date(dateIso + 'T00:00:00Z');

    // Check validFrom: if set, date must be >= validFrom
    if (hotelTax.validFrom) {
      const validFrom = new Date(hotelTax.validFrom);
      validFrom.setUTCHours(0, 0, 0, 0);
      if (checkDate < validFrom) {
        return false;
      }
    }

    // Check validTo: if set, date must be <= validTo
    if (hotelTax.validTo) {
      const validTo = new Date(hotelTax.validTo);
      validTo.setUTCHours(23, 59, 59, 999); // Include the entire day
      if (checkDate > validTo) {
        return false;
      }
    }

    // If no date restrictions or date is within range, tax is valid
    return true;
  }

  private distributeTaxAmountByCode(
    appliedTaxList: any[],
    totalTaxAmount: Decimal,
    taxDetailsMap: Record<string, Decimal>
  ): void {
    if (appliedTaxList.length === 0) return;

    const totalTaxRate = appliedTaxList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);

    if (totalTaxRate === 0) return;

    for (const tax of appliedTaxList) {
      const taxCode = tax.taxCode;
      const taxRate = tax.hotelTax?.rate ?? 0;
      const proportion = new Decimal(taxRate).dividedBy(totalTaxRate);
      const amount = totalTaxAmount.times(proportion);

      taxDetailsMap[taxCode] = (taxDetailsMap[taxCode] ?? new Decimal(0)).plus(amount);
    }
  }

  private setAmenityFields(
    amenity: HotelAmenity,
    calculationResult: any,
    dailyPricingList: HotelAmenityPricingDailyDto[],
    ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[],
    count: number
  ): void {
    // Set calculated values on the amenity object
    (amenity as any).totalBaseAmount = calculationResult.totalBaseAmount;
    (amenity as any).totalBaseAmountBeforeAdjustment =
      calculationResult.totalBaseAmountBeforeAdjustment;
    (amenity as any).taxAmount = calculationResult.taxAmount;
    (amenity as any).taxAmountBeforeAdjustment = calculationResult.taxAmountBeforeAdjustment;
    (amenity as any).serviceChargeAmount = calculationResult.serviceChargeAmount;
    (amenity as any).serviceChargeAmountBeforeAdjustment =
      calculationResult.serviceChargeAmountBeforeAdjustment;
    (amenity as any).totalSellingRate = calculationResult.totalSellingRate;
    (amenity as any).totalGrossAmount = calculationResult.totalGrossAmount;
    (amenity as any).totalGrossAmountBeforeAdjustment =
      calculationResult.totalGrossAmountBeforeAdjustment;
    (amenity as any).dailyPricingList = dailyPricingList;
    (amenity as any).ageCategoryPricingList = ageCategoryPricingList;
    (amenity as any).count = count;

    // Extract included dates from daily pricing list
    (amenity as any).includedDates = dailyPricingList
      .filter((daily) => daily.price.greaterThan(0)) // Only include dates with pricing > 0
      .map((daily) => daily.date)
      .sort(); // Sort dates in ascending order
  }

  private aggregateTotals(calculationResult: any, totals: any): void {
    totals.totalBaseAmount = totals.totalBaseAmount.plus(calculationResult.totalBaseAmount);
    totals.totalBaseAmountBeforeAdjustment = totals.totalBaseAmountBeforeAdjustment.plus(
      calculationResult.totalBaseAmountBeforeAdjustment
    );
    totals.taxAmount = totals.taxAmount.plus(calculationResult.taxAmount);
    totals.taxAmountBeforeAdjustment = totals.taxAmountBeforeAdjustment.plus(
      calculationResult.taxAmountBeforeAdjustment
    );
    totals.serviceChargeAmount = totals.serviceChargeAmount.plus(
      calculationResult.serviceChargeAmount
    );
    totals.serviceChargeAmountBeforeAdjustment = totals.serviceChargeAmountBeforeAdjustment.plus(
      calculationResult.serviceChargeAmountBeforeAdjustment
    );
    totals.totalSellingRate = totals.totalSellingRate.plus(calculationResult.totalSellingRate);
    totals.totalGrossAmount = totals.totalGrossAmount.plus(calculationResult.totalGrossAmount);
    totals.totalGrossAmountBeforeAdjustment = totals.totalGrossAmountBeforeAdjustment.plus(
      calculationResult.totalGrossAmountBeforeAdjustment
    );
  }

  private setAmenityCalculationResults(
    amenity: HotelAmenity,
    results: {
      totalSellingRate: Decimal;
      totalBaseAmount: Decimal;
      totalBaseAmountBeforeAdjustment: Decimal;
      serviceChargeAmount: Decimal;
      serviceChargeAmountBeforeAdjustment: Decimal;
      taxAmount: Decimal;
      taxAmountBeforeAdjustment: Decimal;
      totalGrossAmount: Decimal;
      totalGrossAmountBeforeAdjustment: Decimal;
      averageDailyRate: Decimal;
      dailyPricingList: HotelAmenityPricingDailyDto[];
      ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[];
      count: number;
      taxDetailsMap: Record<string, Decimal>;
    }
  ): void {
    // Set all calculated values on the amenity object
    (amenity as any).totalSellingRate = results.totalSellingRate;
    (amenity as any).totalBaseAmount = results.totalBaseAmount;
    (amenity as any).totalBaseAmountBeforeAdjustment = results.totalBaseAmountBeforeAdjustment;
    (amenity as any).serviceChargeAmount = results.serviceChargeAmount;
    (amenity as any).serviceChargeAmountBeforeAdjustment =
      results.serviceChargeAmountBeforeAdjustment;
    (amenity as any).taxAmount = results.taxAmount;
    (amenity as any).taxAmountBeforeAdjustment = results.taxAmountBeforeAdjustment;
    (amenity as any).totalGrossAmount = results.totalGrossAmount;
    (amenity as any).totalGrossAmountBeforeAdjustment = results.totalGrossAmountBeforeAdjustment;
    (amenity as any).averageDailyRate = results.averageDailyRate;
    (amenity as any).dailyPricingList = results.dailyPricingList;
    (amenity as any).ageCategoryPricingList = results.ageCategoryPricingList;
    (amenity as any).count = results.count;
    (amenity as any).taxDetailsMap = results.taxDetailsMap;

    // Extract included dates from daily pricing list
    (amenity as any).includedDates = results.dailyPricingList
      .filter((daily) => daily.price.greaterThan(0)) // Only include dates with pricing > 0
      .map((daily) => daily.date)
      .sort(); // Sort dates in ascending order
  }

  private mapRoundingMode(mode: RoundingModeEnum): Decimal.Rounding {
    switch (mode) {
      case RoundingModeEnum.UP:
        return Decimal.ROUND_UP;
      case RoundingModeEnum.DOWN:
        return Decimal.ROUND_DOWN;
      case RoundingModeEnum.HALF_UP:
      case RoundingModeEnum.HALF_ROUND_UP:
        return Decimal.ROUND_HALF_UP;
      default:
        return Decimal.ROUND_UP;
    }
  }

  private roundDecimal(
    value: Decimal,
    decimalPlaces: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    return value.toDecimalPlaces(decimalPlaces, roundingMode);
  }
}
