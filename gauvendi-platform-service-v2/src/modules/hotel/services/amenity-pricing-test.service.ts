import { HotelTaxSetting } from '@entities/hotel-entities/hotel-tax-setting.entity';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoundingModeEnum, ServiceChargeSettingEnum, TaxSettingEnum } from 'src/core/enums/common';
import { CalculatePricingAmenityInput } from '../dtos/hotel-amenity.dto';
import { CalculateAmenityPricingService } from './calculate-amenity-pricing.service';

@Injectable()
export class AmenityPricingTestService implements OnModuleInit {
  constructor(private readonly calculateAmenityPricingService: CalculateAmenityPricingService) {}

  async onModuleInit(): Promise<void> {
    // await this.testServiceCombo();
  }

  /**
   * Test the amenity pricing calculation with the provided sample data
   */
  public async testAmenityPricing(): Promise<void> {
    console.log('=== Testing Amenity Pricing Calculation ===\n');

    // Test data from user
    const testAmenities = [
      {
        id: '24bb08cf-82c3-4dc9-bb32-5c460985cb2b',
        name: 'Breakfast',
        description: 'Breakfast',
        amenityType: 'AMENITY',
        pricingUnit: 'PERSON',
        code: 'Breakfast',
        status: 'ACTIVE',
        distributionChannel: ['GV_VOICE', 'GV_SALES_ENGINE'],
        sellingType: 'SINGLE',
        hotelAmenityPrices: [
          {
            price: 25,
            hotelAgeCategory: {
              code: 'DEFAULT'
            }
          }
        ],
        taxSettingList: []
      },
      {
        id: '73761ade-2c7d-491f-b8e1-dfe9400fa20d',
        name: 'Dog1',
        description: null,
        amenityType: 'AMENITY',
        pricingUnit: 'PERSON',
        code: 'Dog1',
        status: 'ACTIVE',
        distributionChannel: ['GV_VOICE', 'GV_SALES_ENGINE'],
        sellingType: 'SINGLE',
        hotelAmenityPrices: [
          {
            price: 50,
            hotelAgeCategory: {
              code: 'DEFAULT'
            }
          }
        ],
        taxSettingList: [
          {
            hotelId: 'test-hotel-id',
            serviceCode: 'Dog1',
            taxCode: 'VAT',
            hotelTax: {
              rate: 0, // 0% VAT
              code: 'VAT',
              name: 'VAT Tax'
            } as any
          }
        ]
      }
    ];

    // Mock hotel data
    const mockHotel = {
      id: 'test-hotel-id',
      name: 'Test Hotel',
      taxSetting: TaxSettingEnum.EXCLUSIVE,
      serviceChargeSetting: ServiceChargeSettingEnum.EXCLUSIVE
    };

    // Pricing rules
    const pricingRule: any = {
      decimalUnits: 2,
      roundingMode: RoundingModeEnum.HALF_UP
    };

    // Test each amenity
    for (let index = 0; index < testAmenities.length; index++) {
      const amenityData = testAmenities[index];
      console.log(`\n--- Test ${index + 1}: ${amenityData.name} (${amenityData.pricingUnit}) ---`);

      const input: CalculatePricingAmenityInput = {
        hotel: mockHotel as any,
        serviceChargeRate: 0, // 0% service charge
        serviceChargeTaxRate: 0, // 0% tax on service charge
        hotelAmenity: amenityData as any,
        fromDate: '2024-01-01',
        toDate: '2024-01-02', // 2 nights
        taxSettingList: amenityData.taxSettingList as any,
        childrenAgeList: [1], // 2 children
        adult: 2, // 2 adults
        allocatedPets: 0
      };

      try {
        await this.calculateAmenityPricingService.calculatePricingAmenity(input, pricingRule);

        // Display results
        const amenity = input.hotelAmenity as any;
        console.log('Results:');
        console.log(`  Selling Price (from DB): ${amenityData.hotelAmenityPrices[0].price}`);
        console.log(`  Base Amount: ${amenity.totalBaseAmount?.toFixed(2) ?? 'N/A'}`);
        console.log(`  Service Charge: ${amenity.serviceChargeAmount?.toFixed(2) ?? 'N/A'}`);
        console.log(`  Tax Amount: ${amenity.taxAmount?.toFixed(2) ?? 'N/A'}`);
        console.log(`  Gross Amount: ${amenity.totalGrossAmount?.toFixed(2) ?? 'N/A'}`);
        console.log(`  Average Daily Rate: ${amenity.averageDailyRate?.toFixed(2) ?? 'N/A'}`);
        console.log(`  Count: ${amenity.count ?? 'N/A'}`);

        if (amenity.dailyPricingList) {
          console.log('  Daily Breakdown:');
          amenity.dailyPricingList.forEach((daily: any) => {
            console.log(
              `    ${daily.date}: ${daily.price?.toFixed(2) ?? 'N/A'} (count: ${daily.count})`
            );
          });
        }

        if (amenity.ageCategoryPricingList) {
          console.log('  Age Category Breakdown:');
          amenity.ageCategoryPricingList.forEach((ageCategory: any) => {
            console.log(
              `    ${ageCategory.ageCategoryCode}: Daily ${ageCategory.dailyPrice?.toFixed(2) ?? 'N/A'} x ${ageCategory.dailyCount} = Total ${ageCategory.totalPrice?.toFixed(2) ?? 'N/A'}`
            );
          });
        }
      } catch (error) {
        console.log(`Error calculating pricing: ${error.message}`);
      }
    }
  }

  /**
   * Test specific pricing scenarios
   */
  public testSpecificScenarios(): void {
    console.log('\n=== Testing Specific Scenarios ===\n');

    console.log('🔍 Key Understanding: Price in hotelAmenityPrices is SELLING PRICE');
    console.log('📊 Tax Setting: EXCLUSIVE means selling price = base amount (before tax)');
    console.log('📊 Tax Setting: INCLUSIVE means selling price = gross amount (after tax)');
    console.log('');
    console.log('For EXCLUSIVE mode with 19% tax:');
    console.log('  Selling Price 20.00 = Base Amount');
    console.log('  Tax: 20.00 × 19% = 3.80');
    console.log('  Gross: 20.00 + 3.80 = 23.80');
    console.log('');
    console.log('For INCLUSIVE mode with 19% tax:');
    console.log('  Selling Price 20.00 = Gross Amount');
    console.log('  Base: 20.00 ÷ 1.19 = 16.81');
    console.log('  Tax: 20.00 - 16.81 = 3.19');
    console.log('');

    // Test COMBO amenity (placeholder since we don't have linked amenities implemented)
    console.log('COMBO amenities would require linked amenity data and database lookups.');
    console.log(
      'The service is structured to handle COMBO pricing by recursively calculating linked amenities.'
    );

    // Test age category pricing
    console.log('\nAge Category Pricing:');
    console.log('- Adults: 2 (no children in current test)');
    console.log('- For PERSON pricing, each age group can have different rates');
    console.log('- DEFAULT category used when no specific age category matches');
  }

  /**
   * Test Service Combo functionality with 3 different scenarios
   * Note: These tests require the linked amenities to exist in the database
   * or the repository to be mocked to return the linked amenities
   */
  public async testServiceCombo(): Promise<void> {
    console.log('\n=== Testing Service Combo Functionality ===\n');

    const mockHotel = {
      id: 'b3bd4b6d-7028-4b1b-84a3-aef53d994e8c',
      name: 'Test Hotel',
      taxSetting: TaxSettingEnum.INCLUSIVE,
      serviceChargeSetting: ServiceChargeSettingEnum.EXCLUSIVE
    };

    const pricingRule: any = {
      decimalUnits: 2,
      roundingMode: RoundingModeEnum.HALF_UP
    };

    // Test Case 2: Service Combo with Different VAT Rates
    await this.testCase2_ComboWithDifferentVAT(mockHotel, pricingRule);
  }
  /**
   * Test Case 2: Service Combo with Different VAT Rates
   * Scenario: Breakfast COMBO with food (7% VAT) and beverages (19% VAT)
   * Expected: Each sub-service gets correct tax rate applied
   */
  private async testCase2_ComboWithDifferentVAT(mockHotel: any, pricingRule: any): Promise<void> {
    console.log('\n--- Test Case 2: Service Combo with Different VAT Rates ---\n');

    // Parent COMBO amenity
    const comboAmenity = {
      id: '7e91a373-840c-445c-80fd-50bab0e06d07',
      name: 'Breakfast',
      description: 'Breakfast',
      amenityType: null,
      pricingUnit: 'PERSON',
      code: '"BREAKFAST_COMBO"',
      status: 'ACTIVE',
      distributionChannel: ['GV_VOICE', 'GV_SALES_ENGINE'],
      sellingType: 'COMBO',
      linkedAmenityCode: 'BFST_FOOD,BFST_BEVERAGE',
      hotelId: 'b3bd4b6d-7028-4b1b-84a3-aef53d994e8c',
      taxSettingList: [
        // Tax settings for sub-services (not parent)
        {
          hotelId: 'b3bd4b6d-7028-4b1b-84a3-aef53d994e8c',
          serviceCode: 'BFST_FOOD',
          taxCode: 'VAT_7',
          hotelTax: {
            rate: 0.07, // 7% VAT for food
            code: 'VAT_7',
            name: 'VAT 7%'
          } as any
        },
        {
          hotelId: 'b3bd4b6d-7028-4b1b-84a3-aef53d994e8c',
          serviceCode: 'BFST_BEVERAGE',
          taxCode: 'VAT_19',
          hotelTax: {
            rate: 0.19, // 19% VAT for beverages
            code: 'VAT_19',
            name: 'VAT 19%'
          } as any
        }
      ]
    };

    const input: CalculatePricingAmenityInput = {
      hotel: mockHotel,
      serviceChargeRate: 0,
      serviceChargeTaxRate: 0,
      hotelAmenity: comboAmenity as any,
      fromDate: '2024-01-01',
      toDate: '2024-01-01',
      taxSettingList: comboAmenity.taxSettingList as any,
      adult: 2,
      childrenAgeList: [],
      allocatedPets: 0
    };

    try {
      await this.calculateAmenityPricingService.calculatePricingAmenity(input, pricingRule);

      const amenity = input.hotelAmenity as any;
      // sum the total gross amount of the linked amenities
      const totalGrossAmount = amenity.linkedAmenityInfoList.reduce(
        (sum: number, linked: any) => sum + (parseFloat(linked.totalGrossAmount ?? '0') ?? 0),
        0
      );
      const totalBaseAmount = amenity.linkedAmenityInfoList.reduce(
        (sum: number, linked: any) => sum + (parseFloat(linked.totalBaseAmount ?? '0') ?? 0),
        0
      );
      const totalTaxAmount = amenity.linkedAmenityInfoList.reduce(
        (sum: number, linked: any) => sum + (parseFloat(linked.taxAmount ?? '0') ?? 0),
        0
      );  
      console.log('✅ Test Case 2 Results:');
      console.log(`  Total Gross Amount: €${totalGrossAmount ?? 'N/A'}`);
      console.log(`  Total Base Amount: €${totalBaseAmount ?? 'N/A'}`);
      console.log(`  Total Tax Amount: €${totalTaxAmount ?? 'N/A'}`);

      if (amenity.linkedAmenityInfoList && amenity.linkedAmenityInfoList.length > 0) {
        console.log(`  Linked Amenities with Different VAT Rates:`);
        amenity.linkedAmenityInfoList.forEach((linked: any, index: number) => {
          const taxRate = linked.code === 'BFST_FOOD' ? '7%' : '19%';
          console.log(`    Sub-service ${index + 1} (${linked.code}) - VAT ${taxRate}:`);
          console.log(`      Base Amount: €${linked.totalBaseAmount?.toFixed(2) ?? 'N/A'}`);
          console.log(`      Tax Amount: €${linked.taxAmount?.toFixed(2) ?? 'N/A'}`);
          console.log(`      Gross Amount: €${linked.totalGrossAmount?.toFixed(2) ?? 'N/A'}`);
        });
      } else {
        console.log('  ⚠️  No linked amenities found (may need to exist in database)');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  /**
   * Test Case 3: Service Combo with Proportional Allocation
   * Scenario: Breakfast COMBO where sub-services have different prices
   * Expected: Allocation proportional to each sub-service's price
   */
  private async testCase3_ComboProportionalAllocation(
    mockHotel: any,
    pricingRule: any
  ): Promise<void> {
    console.log('\n--- Test Case 3: Service Combo with Proportional Allocation ---\n');

    // Parent COMBO amenity
    const comboAmenity = {
      id: 'combo-breakfast-proportional-id',
      name: 'Breakfast',
      description: 'Breakfast with proportional allocation',
      amenityType: 'AMENITY',
      pricingUnit: 'ROOM',
      code: 'BREAKFAST_PROP_COMBO',
      status: 'ACTIVE',
      distributionChannel: ['GV_VOICE', 'GV_SALES_ENGINE'],
      sellingType: 'COMBO',
      linkedAmenityCode: 'BFST_FOOD_PROP,BFST_BEVERAGE_PROP',
      hotelId: mockHotel.id,
      hotelAmenityPrices: [
        {
          price: 20.0, // Parent COMBO selling price
          hotelAgeCategory: {
            code: 'DEFAULT'
          }
        }
      ],
      taxSettingList: []
    };

    // Expected scenario:
    // BFST_FOOD_PROP: €15.00 (75% of total)
    // BFST_BEVERAGE_PROP: €5.00 (25% of total)
    // Total linked: €20.00
    // Allocation should be:
    // BFST_FOOD_PROP: (15/20) × 20 = €15.00
    // BFST_BEVERAGE_PROP: (5/20) × 20 = €5.00

    const input: CalculatePricingAmenityInput = {
      hotel: mockHotel,
      serviceChargeRate: 0,
      serviceChargeTaxRate: 0,
      hotelAmenity: comboAmenity as any,
      fromDate: '2024-01-01',
      toDate: '2024-01-01',
      taxSettingList: [],
      adult: 2,
      childrenAgeList: [],
      allocatedPets: 0
    };

    try {
      await this.calculateAmenityPricingService.calculatePricingAmenity(input, pricingRule);

      const amenity = input.hotelAmenity as any;
      console.log('✅ Test Case 3 Results:');
      console.log(`  Parent COMBO Price: €${comboAmenity.hotelAmenityPrices[0].price.toFixed(2)}`);

      if (amenity.linkedAmenityInfoList && amenity.linkedAmenityInfoList.length > 0) {
        console.log(`  Proportional Allocation Based on Linked Service Prices:`);

        let totalAllocated = 0;
        amenity.linkedAmenityInfoList.forEach((linked: any, index: number) => {
          const allocatedPrice = linked.totalSellingRate?.toNumber() || 0;
          totalAllocated += allocatedPrice;
          const percentage = (allocatedPrice / comboAmenity.hotelAmenityPrices[0].price) * 100;

          console.log(`    Sub-service ${index + 1} (${linked.code}):`);
          console.log(
            `      Allocated Price: €${allocatedPrice.toFixed(2)} (${percentage.toFixed(1)}%)`
          );
          console.log(`      Base Amount: €${linked.totalBaseAmount?.toFixed(2) ?? 'N/A'}`);
          console.log(`      Gross Amount: €${linked.totalGrossAmount?.toFixed(2) ?? 'N/A'}`);
        });

        // Validate proportional allocation
        const parentPrice = comboAmenity.hotelAmenityPrices[0].price;
        const difference = Math.abs(totalAllocated - parentPrice);

        console.log(`\n  Allocation Summary:`);
        console.log(`    Parent Price: €${parentPrice.toFixed(2)}`);
        console.log(`    Total Allocated: €${totalAllocated.toFixed(2)}`);
        console.log(`    Difference: €${difference.toFixed(2)}`);

        if (difference < 0.01) {
          console.log(`  ✅ Proportional Allocation Validation: PASSED`);
        } else {
          console.log(`  ⚠️  Proportional Allocation Validation: WARNING`);
        }

        // Check if allocation is proportional (not equal)
        if (amenity.linkedAmenityInfoList.length === 2) {
          const price1 = amenity.linkedAmenityInfoList[0].totalSellingRate?.toNumber() || 0;
          const price2 = amenity.linkedAmenityInfoList[1].totalSellingRate?.toNumber() || 0;
          const isProportional = Math.abs(price1 - price2) > 0.01;
          console.log(
            `  ${isProportional ? '✅' : '⚠️'} Allocation is ${isProportional ? 'proportional' : 'equal'} (not proportional as expected)`
          );
        }
      } else {
        console.log('  ⚠️  No linked amenities found (may need to exist in database)');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(
        '  Note: This test requires linked amenities (BFST_FOOD_PROP, BFST_BEVERAGE_PROP) to exist in the database'
      );
    }
  }
}
