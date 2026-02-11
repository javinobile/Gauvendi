import { Injectable } from '@nestjs/common';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { Hotel, TaxSettingEnum } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelPricingDecimalRoundingRuleDto } from './dtos/hotel-pricing-decimal-rounding-rule.dto';
import { HotelTaxSettingDtoLike } from './dtos/hotel-tax-compossite-model-like';

type TaxCode = string;
type TaxAmount = number;

@Injectable()
export class BookingTaxService {
  private readonly specialTaxCode = process.env.SPECIAL_TAX_CODE || 'GV732894_VAT15';
  constructor() {}

  getHotelServiceChargeRate(_hotelId: string): number {
    // TODO: Implement service charge rate retrieval logic
    return 0;
  }

  /**
   * Get hotel tax rate by code
   */
  getHotelTaxRateByCode(hotelTaxSettings: HotelTaxSetting[], code: string): number {
    let taxRate = 0;

    const hotelTaxSettingList = hotelTaxSettings.filter((x) => x.hotelTax?.code === code);

    if (hotelTaxSettingList && hotelTaxSettingList.length > 0) {
      for (const taxMapping of hotelTaxSettingList) {
        const rate = taxMapping.hotelTax?.rate || 0;
        taxRate += rate;
      }
    }

    return taxRate;
  }

  /**
   * Calculate amenity tax amount by tax codes for a given date.
   *
   * Switch by hotel tax mode:
   * - INCLUSIVE (reverse):
   *   base = gross / (1 + svc%/100) / (1 + tax%/100)
   *   svc  = base × (svc%/100)
   *   tax  = gross − base − svc
   * - EXCLUSIVE (forward):
   *   svc  = base × (svc%/100)
   *   tax(each) = (base + (svcTax>0?svc:0)) × (rate%/100)
   *   special VAT (if matched by code): taxVAT = (Σtax + base) × (vat%/100)
   */
  calculateAmenityTaxAmount(params: {
    hotel: Hotel;
    hotelAmenity: HotelAmenity;
    amenitySellingRate: number;
    taxSettings: HotelTaxSetting[];
    serviceChargeRate: number;
    serviceChargeTaxRate: number;

    date: string; // yyyy-MM-dd
  }): Record<string, number> {
    const {
      hotel,
      hotelAmenity,
      amenitySellingRate,
      serviceChargeRate,
      serviceChargeTaxRate,
      taxSettings,
      date
    } = params;

    const svcChargeRate = Number(serviceChargeRate) || 0;
    const svcChargeTaxRate = Number(serviceChargeTaxRate) || 0;
    const serviceCode = hotelAmenity.code;
    const taxSettingList = taxSettings
      .filter((x) => x.serviceCode === serviceCode)
      .filter((x) => this.isValidDailyHotelTax(x.hotelTax, date));
    if (!taxSettingList || taxSettingList.length === 0) return {};

    return (hotel.taxSetting ?? TaxSettingEnum.INCLUSIVE) === TaxSettingEnum.INCLUSIVE
      ? this.calculateTaxAmountInclusiveProperty(
          taxSettingList,
          amenitySellingRate,
          svcChargeRate,
          svcChargeTaxRate
        )
      : this.calculateTaxAmountExclusiveProperty(
          taxSettingList,
          amenitySellingRate,
          svcChargeRate,
          svcChargeTaxRate
        );
  }

  calculateRoomTaxAmount(
    hotel: Hotel,
    roomSellingRate: number,
    taxSettings: HotelTaxSetting[],
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    date: string,
    salesPlanCode: string,
    pricingDecimalRoundingRule: any
  ): Record<string, number> {
    if (!roomSellingRate) {
      return {};
    }

    const taxSettingList = taxSettings
      .filter((x) => x.serviceCode === salesPlanCode)
      .filter((item: any) => this.isValidDailyHotelTax(item.hotelTax, date));

    if (!taxSettingList.length) {
      return {};
    }

    return hotel.taxSetting === 'INCLUSIVE'
      ? this.calculateTaxAmountInclusiveProperty(
          taxSettingList,
          roomSellingRate,
          serviceChargeRate,
          serviceChargeTaxRate
        )
      : this.calculateTaxAmountExclusiveProperty(
          taxSettingList,
          roomSellingRate,
          serviceChargeRate,
          serviceChargeTaxRate
        );
  }

  /**
   * Inclusive property formula (reverse tax):
   * base = gross / (1 + svc%/100) / (1 + tax%/100)
   * svc  = base × (svc%/100)
   * tax  = gross − base − svc
   */
  private calculateTaxAmountInclusiveProperty(
    taxSettingList: HotelTaxSettingDtoLike[],
    totalGrossAmount: number,
    serviceChargeRate: number,
    serviceChargeTaxRate: number
  ): Record<string, number> {
    const taxDetails: Record<TaxCode, TaxAmount> = {};
    for (const taxSetting of taxSettingList) {
      const taxCode = taxSetting?.hotelTax?.code ?? taxSetting?.taxCode ?? 'UNKNOWN_TAX';
      const taxRate = Number(taxSetting?.hotelTax?.rate) || 0; // percent

      // Reverse: gross = base + svc + tax; assume svc = base * svcRate; tax computed as residual
      const base =
        taxRate > 0 || serviceChargeRate > 0
          ? totalGrossAmount / (1 + serviceChargeRate / 100) / (1 + taxRate / 100)
          : totalGrossAmount;
      const serviceCharge = base * (serviceChargeRate / 100);
      const taxAmount = Math.max(0, totalGrossAmount - base - serviceCharge);
      taxDetails[taxCode] = (taxDetails[taxCode] ?? 0) + taxAmount;
    }
    return taxDetails;
  }

  /**
   * Exclusive property formula (forward tax):
   * svc = base × (svc%/100)
   * tax(each) = (base + (svcTax>0?svc:0)) × (rate%/100)
   * special VAT (if any): taxVAT = (Σtax + base) × (vat%/100)
   */
  private calculateTaxAmountExclusiveProperty(
    taxSettingList: HotelTaxSettingDtoLike[],
    totalBaseAmount: number,
    serviceChargeRate: number,
    serviceChargeTaxRate: number
  ): Record<string, number> {
    const taxDetails: Record<string, number> = {};
    let totalTaxAmount = 0;

    // Find special tax (like VAT) by contains logic similar to Java (configurable in Java)
    const special = taxSettingList.find((t) =>
      (t.taxCode || t.hotelTax?.code || '').includes('VAT')
    );

    for (const taxSetting of taxSettingList) {
      const taxCode = taxSetting?.hotelTax?.code ?? taxSetting?.taxCode ?? 'UNKNOWN_TAX';
      if (special && taxCode === special.hotelTax?.code) {
        continue; // handle at the end
      }
      const rate = Number(taxSetting?.hotelTax?.rate) || 0; // percent
      const serviceCharge = totalBaseAmount * (serviceChargeRate / 100);
      const taxAmount =
        (totalBaseAmount + serviceCharge * (serviceChargeTaxRate > 0 ? 1 : 0)) * (rate / 100);
      totalTaxAmount += taxAmount;
      taxDetails[taxCode] = (taxDetails[taxCode] ?? 0) + taxAmount;
    }

    if (special) {
      const subTotal = totalTaxAmount + totalBaseAmount;
      const code = special.hotelTax?.code ?? special.taxCode ?? 'SPECIAL_TAX';
      const rate = Number(special?.hotelTax?.rate) || 0;
      const taxAmount = subTotal * (rate / 100);
      taxDetails[code] = (taxDetails[code] ?? 0) + taxAmount;
    }

    return taxDetails;
  }

  /**
   * Calculate room net price (for exclusive hotels only)
   */
  calculateRoomNetPrice(
    taxSettingList: HotelTaxSetting[],
    roomGrossPrice: number,
    date: string,
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto,
    taxes: HotelTax[]
  ): number {
    // No tax -> Net = Gross
    if (!taxSettingList.length) {
      return roomGrossPrice;
    }

    const appliedTaxSettingList = taxSettingList.filter((taxSetting) =>
      this.isValidDailyHotelTax(taxes.find((tax) => tax.code === taxSetting.serviceCode)!, date)
    );

    if (!appliedTaxSettingList.length) {
      return roomGrossPrice;
    }

    const specialTax = appliedTaxSettingList.find((taxSetting) =>
      taxSetting.taxCode.includes(this.specialTaxCode)
    );

    let taxRate = 1;

    if (specialTax) {
      const vatTaxRate = specialTax.hotelTax.rate / 100;
      taxRate = 1 + vatTaxRate;
    }

    const totalTaxRate = appliedTaxSettingList
      .filter((taxSetting) => taxSetting.hotelTax.code !== this.specialTaxCode)
      .reduce((sum, taxSetting) => sum + taxSetting.hotelTax.rate / 100, 0);

    taxRate = taxRate * (1 + totalTaxRate);

    const netPrice = roomGrossPrice / taxRate;

    // Apply rounding
    const multiplier = Math.pow(10, pricingDecimalRoundingRule.decimalUnits);
    return Math.round(netPrice * multiplier) / multiplier;
  }

  isValidDailyHotelTax(hotelTax: { validFrom?: Date; validTo?: Date }, date: string) {
    const invalidFromDateChecking = hotelTax.validFrom && hotelTax.validFrom > new Date(date);
    const invalidToDateChecking = hotelTax.validTo && hotelTax.validTo < new Date(date);

    return !(invalidFromDateChecking || invalidToDateChecking);
  }
}
