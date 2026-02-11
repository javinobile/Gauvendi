import gql from 'graphql-tag';

export const QueryAvailableAmenityDocs = gql`
    query AvailableAmenity($filter: HotelAmenityFilter) {
  response: availableAmenity(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelAmenity {
        id
        name
        code
        description
        amenityType
        pricingUnit
        iconImageUrl
        totalBaseAmount
        totalGrossAmount
        baseRate
        hotelAmenityPriceList {
          hotelAgeCategory {
            code
            name
            fromAge
            toAge
          }
          price
        }
      }
    }
  }
}
    `;
export const QueryAvailableDailyRateDocs = gql`
    query AvailableDailyRate($filter: CalendarRateFilter) {
  response: availableDailyRate(filter: $filter) {
    count
    totalPage
    data {
      ... on DailyRate {
        date
        totalBaseAmount
        totalGrossAmount
        hotelRestrictionList {
          code
          value
          fromDate
          toDate
        }
      }
    }
  }
}
    `;
export const QueryAvailablePaymentMethodListDocs = gql`
    query AvailablePaymentMethodList($filter: AvailablePaymentMethodFilter) {
  response: availablePaymentMethodList(filter: $filter) {
    count
    totalPage
    data {
      ... on AvailablePaymentMethod {
        paymentMethodId
        paymentMethodCode
        paymentMethodName
        paymentMethodDescription
        paymentMethodDetailsList {
          paymentProvider {
            id
            code
            name
            description
          }
          metadata {
            value
            metadata
          }
        }
      }
    }
  }
}
    `;
export const QueryAvailableRfcDocs = gql`
    query AvailableRfc($bookingRequest: BookingRequest) {
  response: availableRfc(bookingRequest: $bookingRequest) {
    count
    totalPage
    data {
      ... on Rfc {
        numberOfBedrooms
        space
        id
        name
        code
        capacityDefault
        matchingPercentage
        rfcType
        allocatedAdultCount
        allocatedChildCount
        allocatedExtraBedAdultCount
        allocatedExtraBedChildCount
        restrictionValidationList {
          code
          value
          fromDate
          toDate
        }
        rfcImageList {
          imageUrl
          displaySequence
          description
        }
        layoutFeatureList {
          name
          code
        }
        retailFeatureList {
          name
          code
          matched
          quantity
          hotelRetailCategory {
            name
            code
          }
        }
        additionalFeatureList {
          name
          code
          matched
          quantity
        }
        standardFeatureList {
          name
          code
        }
        rfcRatePlanList {
          name
          code
          averageDailyRate
          totalBaseAmount
          totalGrossAmount
          totalSellingRate
          ratePlan {
            code
            name
            description
            includedHotelExtrasList {
              id
              code
              name
              description
            }
          }
        }
      }
    }
  }
}
    `;
export const QueryBookingStatusDocs = gql`
    query BookingStatus($filter: BookingStatusFilter) {
  response: bookingStatus(filter: $filter) {
    count
    totalPage
    data {
      ... on BookingPaymentResponse {
        action {
          data {
            MD
            paReq
            termUrl
          }
          id
          method
          paymentData
          paymentMethodId
          url
          paymentProviderCode
          type
        }
        booking {
          id
        }
        bookingTransaction {
          status
        }
      }
    }
  }
}
    `;
export const QueryBookingSummaryDocs = gql`
    query BookingSummary($filter: BookingFilter) {
  response: bookingSummary(filter: $filter) {
    id
    bookingNumber
    hotelPaymentModeCode
    status
    bookingTransactionList {
      accountNumber
      accountHolder
      expiryMonth
      expiryYear
      cardType
      totalAmount
      currency {
        id
        code
        name
      }
    }
    arrival
    departure
    payOnConfirmationAmount
    payAtHotelAmount
    averageDailyRate
    totalBaseAmount
    totalGrossAmount
    totalSellingRate
    serviceChargeAmount
    taxAmount
    cityTaxAmount
    balance
    ratePlanName
    ratePlanDescription
    promoCode
    specialRequest
    totalAdult
    totalChildren
    childrenAgeList
    bookingFlow
    bookingCityTaxList {
      id
      name
      code
      value
      cityTaxAmount
    }
    bookingTaxList {
      name
      code
      rate
      amount
    }
    paymentTerm {
      name
      code
      description
      payAtHotelDescription
      payOnConfirmationDescription
    }
    cxlPolicy {
      name
      description
    }
    bookingMetadataList {
      value
    }
    occasionList {
      name
    }
    travelTagList {
      name
    }
    additionalGuest {
      firstName
      lastName
      isAdult
      countryId
      emailAddress
      address
      city
      state
      phoneNumber
      postalCode
    }
    guestList {
      firstName
      lastName
      isAdult
      countryId
      emailAddress
      address
      city
      state
      phoneNumber
      postalCode
      countryNumber
    }
    currency {
      name
      code
    }
    booker {
      firstName
      lastName
      emailAddress
      address
      city
      state
      countryId
      postalCode
      phoneNumber
      companyName
      companyCity
      companyTaxId
      companyEmail
      companyAddress
      companyCountry
      companyPostalCode
      countryNumber
    }
    cancelledBy
    cancelledDate
    cancelledReason
    cityTaxList {
      unit
      name
      value
      description
      cityTaxAmount
      translationList {
        name
        languageCode
        description
      }
    }
    reservationList {
      id
      reservationNumber
      arrival
      departure
      tripPurpose
      additionalGuest {
        firstName
        lastName
      }
      matchedFeatureList {
        name
        code
        quantity
        retailFeatureImageList {
          imageUrl
        }
      }
      arrival
      departure
      adult
      childrenAgeList
      totalBaseAmount
      totalGrossAmount
      totalSellingRate
      totalAccommodationAmount
      serviceChargeAmount
      taxAmount
      balance
      guestNote
      rfc {
        code
        name
        space
        numberOfBedrooms
        rfcImageList {
          imageUrl
        }
        retailFeatureList {
          id
          name
          code
          quantity
          retailFeatureImageList {
            imageUrl
          }
        }
        standardFeatureList {
          id
          name
          code
          iconImageUrl
        }
      }
      paymentTerm {
        name
        code
        description
        payAtHotelDescription
        payOnConfirmationDescription
      }
      cxlPolicy {
        name
        description
      }
      rfcRatePlan {
        code
        name
        ratePlan {
          code
          name
          description
        }
      }
      stayOption {
        id
        name
        type
      }
      reservationAmenityList {
        id
        totalBaseAmount
        totalGrossAmount
        serviceChargeAmount
        taxAmount
        totalSellingRate
        hotelAmenity {
          id
          name
          code
          displaySequence
          iconImageUrl
        }
        reservationAmenityDateList {
          id
          date
          totalBaseAmount
          totalGrossAmount
          serviceChargeAmount
          taxAmount
          totalSellingRate
          count
        }
      }
    }
  }
}
    `;
export const QueryCalendarDailyRateListDocs = gql`
    query CalendarDailyRateList($filter: CalendarDailyRateFilter) {
  response: calendarDailyRateList(filter: $filter) {
    count
    totalPage
    data {
      ... on CalendarDailyRate {
        date
        priceOptionList {
          price
          salesPlanId
          roomProductId
          label
          status
          roomOnlyPrice
          netPrice
          grossPrice
          restrictionList {
            restrictionCode
            restrictionValue
          }
        }
      }
    }
  }
}
    `;
export const QueryCountryListDocs = gql`
    query CountryList {
  response: countryList {
    id
    name
    code
    phoneCode
  }
}
    `;
export const QueryCppBookingSummaryDocs = gql`
    query CppBookingSummary($filter: CppBookingSummaryFilter) {
  response: cppBookingSummary(filter: $filter) {
    id
    status
    bookingNumber
    arrival
    departure
    acceptTnc
    totalAdult
    cancelledDate
    totalChildren
    payOnConfirmationAmount
    payAtHotelAmount
    totalBaseAmount
    totalGrossAmount
    totalSellingRate
    bookingFlow
    specialRequest
    booker {
      id
      address
      city
      state
      countryId
      country {
        id
        phoneCode
        name
        code
      }
      postalCode
      phoneNumber
      countryNumber
      firstName
      lastName
      phoneNumber
      emailAddress
      countryId
      countryNumber
      address
      city
      postalCode
      companyName
      companyCity
      companyTaxId
      companyAddress
      companyCountry
      companyEmail
      companyPostalCode
    }
    guestList {
      id
      isBooker
      isMainGuest
      isReturningGuest
      countryId
      firstName
      lastName
      phoneNumber
      city
      state
      emailAddress
      countryId
      countryNumber
      postalCode
      isAdult
      country {
        name
        id
      }
      address
    }
    additionalGuest {
      firstName
      lastName
      isAdult
    }
    bookingCityTaxList {
      id
      name
      code
      value
      cityTaxAmount
    }
    bookingTaxList {
      name
      code
      rate
      amount
    }
    cityTaxList {
      unit
      name
      value
      description
      cityTaxAmount
      translationList {
        name
        languageCode
        description
      }
    }
    paymentTerm {
      name
      code
      description
      payAtHotelDescription
      payOnConfirmationDescription
    }
    cxlPolicy {
      name
      description
    }
    reservationList {
      id
      additionalGuest {
        firstName
        lastName
        isAdult
      }
      primaryGuest {
        id
        countryId
        firstName
        lastName
        phoneNumber
        city
        state
        emailAddress
        countryId
        countryNumber
        postalCode
        isAdult
        country {
          name
          id
        }
        address
        isBooker
        isMainGuest
      }
      reservationNumber
      status
      adult
      childrenAgeList
      pets
      arrival
      departure
      specialRequest
      guestNote
      totalBaseAmount
      taxAmount
      serviceChargeAmount
      cityTaxAmount
      totalGrossAmount
      totalSellingRate
      payOnConfirmationAmount
      payAtHotelAmount
      totalAccommodationAmount
      paymentTerm {
        name
        code
        description
        payAtHotelDescription
        payOnConfirmationDescription
      }
      cxlPolicy {
        name
        description
      }
      rfc {
        name
        description
        numberOfBedrooms
        extraBedKid
        extraBedAdult
        space
        rfcImageList {
          imageUrl
        }
        retailFeatureList {
          name
          code
          measurementUnit
          hotelRetailCategory {
            code
          }
          retailFeatureImageList {
            imageUrl
          }
        }
        standardFeatureList {
          name
          code
          iconImageUrl
        }
      }
      matchedFeatureList {
        code
        name
        quantity
        description
        retailFeatureImageList {
          imageUrl
        }
      }
      rfcRatePlan {
        ratePlan {
          name
          code
          description
        }
      }
      tripPurpose
      company {
        taxId
        name
        email
        address
        city
        country
        postalCode
      }
      reservationAmenityList {
        id
        totalBaseAmount
        totalGrossAmount
        serviceChargeAmount
        taxAmount
        totalSellingRate
        hotelAmenity {
          id
          name
          code
          displaySequence
          iconImageUrl
        }
        reservationAmenityDateList {
          id
          date
          totalBaseAmount
          totalGrossAmount
          serviceChargeAmount
          taxAmount
          totalSellingRate
          count
        }
      }
    }
    hotelPaymentModeCode
    bookingTransactionList {
      id
      transactionNumber
      status
      accountNumber
      accountHolder
      expiryMonth
      expiryYear
      cardType
      totalAmount
    }
  }
}
    `;
export const QueryCurrencyListDocs = gql`
    query CurrencyList {
  response: currencyList {
    id
    name
    code
  }
}
    `;
export const QueryDedicatedStayOptionListDocs = gql`
    query DedicatedStayOptionList($filter: StayOptionFilter) {
  response: dedicatedStayOptionList(filter: $filter) {
    count
    totalPage
    data {
      ... on StayOptionSuggestion {
        label
        restrictionValidationList {
          value
          fromDate
          toDate
          code
        }
        availableRfcList {
          code
          name
          description
          matchingPercentage
          rfcImageList {
            imageUrl
          }
          mostPopularFeatureList {
            code
            name
            hotelRetailCategory {
              code
              name
            }
          }
          retailFeatureList {
            name
            code
            matched
            quantity
            description
            hotelRetailCategory {
              code
              name
            }
            measurementUnit
          }
          additionalFeatureList {
            name
            code
            matched
            quantity
            description
          }
          layoutFeatureList {
            code
          }
          rfcRatePlanList {
            name
            code
            averageDailyRate
            totalSellingRate
            restrictionValidationList {
              code
              value
              fromDate
              toDate
            }
            ratePlan {
              code
              IsPromoted
              hotelPaymentTerm {
                name
                code
                description
              }
              hotelCancellationPolicy {
                name
                description
              }
              includedHotelExtrasList {
                id
                name
                code
                description
                includedDates
                pricingUnit
              }
            }
          }
          capacityDefault
          capacityExtra
          allocatedExtraBedAdultCount
          allocatedExtraBedChildCount
          allocatedAdultCount
          allocatedChildCount
          allocatedPetCount
          numberOfBedrooms
          space
          travelTagList {
            type
            name
            code
          }
          occasionList {
            type
            name
            code
          }
          standardFeatureList {
            name
            code
            description
            iconImageUrl
          }
        }
        availableRfcRatePlanList {
          code
          name
          averageDailyRate
          totalGrossAmount
          totalBaseAmount
          totalSellingRate
          totalBaseAmountBeforeAdjustment
          totalGrossAmountBeforeAdjustment
          adjustmentPercentage
          shouldShowStrikeThrough
          ratePlan {
            code
            name
            description
            IsPromoted
            includedHotelExtrasList {
              name
              code
              description
              pricingUnit
              includedDates
            }
          }
        }
        unavailableRfcRatePlanList {
          code
          name
          averageDailyRate
          totalGrossAmount
          totalBaseAmount
          totalSellingRate
          totalBaseAmountBeforeAdjustment
          totalGrossAmountBeforeAdjustment
          adjustmentPercentage
          shouldShowStrikeThrough
          ratePlan {
            code
            name
            description
            IsPromoted
            includedHotelExtrasList {
              name
              code
              description
            }
          }
        }
      }
    }
  }
}
    `;
export const QueryHotelListDocs = gql`
    query HotelList($filter: HotelFilter) {
  response: hotelList(filter: $filter) {
    count
    totalPage
    data {
      ... on Hotel {
        id
        name
        code
        timeZone
        iconImageUrl
        iconSymbolUrl
        state
        city
        address
        phoneCode
        phoneNumber
        emailAddressList
        postalCode
        signature
        backgroundCategoryImageUrl
        customThemeImageUrl
        lowestPriceImageUrl
        measureMetric
        addressDisplay
        isCityTaxIncludedSellingPrice
        brand {
          name
        }
        country {
          code
          name
          phoneCode
          translationList {
            languageCode
            name
          }
        }
        taxSetting
        serviceChargeSetting
        hotelPaymentModeList {
          id
          code
          name
          description
        }
        hotelConfigurationList {
          configType
          configValue {
            minChildrenAge
            maxChildrenAge
            maxChildrenCapacity
            colorCode
            shortDescription
            content
            title
            value
            metadata
          }
        }
        paymentAccount {
          paymentId
          publicKey
          type
          subMerchantId
        }
        baseCurrency {
          code
          currencyRateList {
            rate
            exchangeCurrency {
              code
            }
          }
        }
        stayOptionBackgroundImageUrl
        customizeStayOptionBackgroundImageUrl
        stayOptionSuggestionImageUrl
        signatureBackgroundImageUrl
      }
    }
  }
}
    `;
export const QueryHotelRestrictionListDocs = gql`
    query HotelRestrictionList($filter: HotelRestrictionFilter) {
  response: hotelRestrictionList(filter: $filter) {
    data {
      ... on HotelRestriction {
        code
        value
        fromDate
        toDate
      }
    }
  }
}
    `;
export const QueryHotelRetailCategoryListDocs = gql`
    query HotelRetailCategoryList($filter: HotelRetailCategoryFilter) {
  response: hotelRetailCategoryList(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelRetailCategory {
        name
        code
        displaySequence
        iconImageUrl
        categoryType
        hotelRetailFeatureList {
          code
          name
        }
      }
    }
  }
}
    `;
export const QueryHotelRetailFeatureListDocs = gql`
    query HotelRetailFeatureList($filter: HotelRetailFeatureFilter) {
  response: hotelRetailFeatureList(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelRetailFeature {
        name
        code
        description
        shortDescription
        displaySequence
        hotelRetailCategory {
          code
          name
        }
        retailFeatureImageList {
          description
          imageUrl
        }
        measurementUnit
      }
    }
  }
}
    `;
export const QueryHotelTagListDocs = gql`
    query HotelTagList($filter: HotelTagFilter) {
  response: hotelTagList(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelTag {
        id
        hotelId
        type
        name
        code
        assignedFeatureList {
          id
          code
          hotelRetailCategory {
            id
            name
            code
          }
          retailFeatureImageList {
            imageUrl
          }
        }
      }
    }
  }
}
    `;
export const QueryHotelTemplateEmailListDocs = gql`
    query HotelTemplateEmailList($filter: IbeHotelTemplateEmailFilter) {
  response: hotelTemplateEmailList(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelTemplateEmail {
        closingSection
        languageCode
        code
        name
        templateId
        isDefault
        signature
      }
    }
  }
}
    `;
export const QueryIbeNearestAvailableDateDocs = gql`
    query IbeNearestAvailableDate($filter: IbeNearestAvailableDateFilter) {
  response: ibeNearestAvailableDate(filter: $filter) {
    data {
      ... on IbeNearestAvailableDate {
        arrival
        departure
      }
    }
  }
}
    `;
export const QueryIncludedHotelExtrasListDocs = gql`
    query IncludedHotelExtrasList($filter: IncludedHotelExtrasFilter) {
  response: includedHotelExtrasList(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelAmenity {
        name
        code
        amenityType
        isIncluded
      }
    }
  }
}
    `;
export const QueryPaymentOptionsBySalesPlanDocs = gql`
    query PaymentOptionsBySalesPlan($filter: PaymentOptionsBySalesPlanFilter) {
  response: paymentOptionsBySalesPlan(filter: $filter) {
    data {
      ... on HotelPaymentMode {
        code
      }
    }
  }
}
    `;
export const QueryPropertyBrandingListDocs = gql`
    query PropertyBrandingList($filter: PropertyBrandingFilter) {
  response: propertyBrandingList(filter: $filter) {
    data {
      ... on PropertyBranding {
        key
        value
      }
    }
  }
}
    `;
export const QueryPropertyMainFontInformationDocs = gql`
    query PropertyMainFontInformation($filter: PropertyMainFontFilter) {
  response: propertyMainFontInformation(filter: $filter) {
    count
    totalPage
    data {
      ... on PropertyMainFont {
        fontName
        isCustomFont
        fontWeightDetailsList {
          url
          originalName
          contentType
          type
        }
      }
    }
  }
}
    `;
export const QueryRatePlanListDocs = gql`
    query RatePlanList($filter: HotelRatePlanFilter) {
  response: ratePlanList(filter: $filter) {
    count
    totalPage
    data {
      ... on RatePlan {
        id
        code
        name
        description
        strongestPaymentTermsCode
        strongestPaymentTerms {
          description
          name
        }
        strongestCxlPolicyCode
        strongestCxlPolicy {
          description
          name
        }
        mandatoryHotelExtrasIdList
        mandatoryHotelExtrasList {
          id
          code
        }
      }
    }
  }
}
    `;
export const QueryRoomProductIncludedHotelExtraListDocs = gql`
    query RoomProductIncludedHotelExtraList($filter: IbeRoomProductIncludedHotelExtraListFilter) {
  response: roomProductIncludedHotelExtraList(filter: $filter) {
    count
    data {
      ... on HotelAmenity {
        id
        name
        code
        amenityType
      }
    }
  }
}
    `;
export const QuerySearchMatchingRfcDocs = gql`
    query SearchMatchingRfc($filter: SearchMatchingRfcFilter) {
  response: searchMatchingRfc(filter: $filter) {
    count
    totalPage
    data {
      ... on Rfc {
        numberOfBedrooms
        space
        id
        name
        code
        capacityDefault
        capacityExtra
        matchingPercentage
        rfcType
        allocatedAdultCount
        allocatedChildCount
        allocatedExtraBedAdultCount
        allocatedExtraBedChildCount
        allocatedPetCount
        rfcImageList {
          imageUrl
          displaySequence
          description
        }
        layoutFeatureList {
          name
          code
        }
        retailFeatureList {
          name
          code
          matched
          quantity
          description
          hotelRetailCategory {
            name
            code
          }
        }
        additionalFeatureList {
          name
          code
          matched
          quantity
          description
        }
        standardFeatureList {
          name
          code
          description
        }
        rfcRatePlanList {
          name
          code
          averageDailyRate
          totalBaseAmount
          totalGrossAmount
          totalSellingRate
          ratePlan {
            code
            name
            description
            IsPromoted
            includedHotelExtrasList {
              id
              code
              name
              description
            }
          }
        }
        restrictionValidationList {
          code
          value
          fromDate
          toDate
        }
      }
    }
  }
}
    `;
export const QuerySearchMatchingRfcV2Docs = gql`
    query SearchMatchingRfcV2($filter: SearchMatchingRfcFilter) {
  response: searchMatchingRfcV2(filter: $filter) {
    count
    totalPage
    data {
      ... on Rfc {
        numberOfBedrooms
        space
        id
        name
        code
        description
        capacityDefault
        capacityExtra
        matchingPercentage
        rfcType
        allocatedAdultCount
        allocatedChildCount
        allocatedExtraBedAdultCount
        allocatedExtraBedChildCount
        allocatedPetCount
        rfcImageList {
          imageUrl
          displaySequence
          description
        }
        layoutFeatureList {
          name
          code
        }
        retailFeatureList {
          name
          code
          matched
          quantity
          description
          hotelRetailCategory {
            name
            code
          }
          measurementUnit
        }
        additionalFeatureList {
          name
          code
          matched
          quantity
          description
          measurementUnit
        }
        standardFeatureList {
          name
          code
          description
          iconImageUrl
        }
        rfcRatePlanList {
          name
          code
          averageDailyRate
          totalBaseAmount
          totalGrossAmount
          totalSellingRate
          totalBaseAmountBeforeAdjustment
          totalGrossAmountBeforeAdjustment
          shouldShowStrikeThrough
          adjustmentPercentage
          ratePlan {
            code
            name
            description
            IsPromoted
            includedHotelExtrasList {
              id
              code
              name
              description
              pricingUnit
              includedDates
            }
          }
        }
        restrictionValidationList {
          code
          value
          fromDate
          toDate
        }
      }
    }
  }
}
    `;
export const QueryStayOptionListDocs = gql`
    query StayOptionList($filter: StayOptionFilter) {
  response: stayOptionList(filter: $filter) {
    count
    totalPage
    data {
      ... on StayOption {
        code
        amenityList {
          id
          name
          code
          amenityType
        }
      }
    }
  }
}
    `;
export const QueryStayOptionRecommendationListV2Docs = gql`
    query StayOptionRecommendationListV2($filter: StayOptionRecommendationFilter) {
  response: stayOptionRecommendationListV2(filter: $filter) {
    count
    totalPage
    data {
      ... on StayOptionSuggestion {
        featureSuggestionList {
          code
          name
          retailFeatureImageList {
            imageUrl
          }
        }
        tripRecommendationTitle
        label
        restrictionValidationList {
          value
          fromDate
          toDate
          code
        }
        availableRfcList {
          code
          name
          description
          matchingPercentage
          isSpaceTypeSearchMatched
          rfcImageList {
            imageUrl
          }
          mostPopularFeatureList {
            code
            name
            hotelRetailCategory {
              code
              name
            }
          }
          retailFeatureList {
            name
            code
            matched
            quantity
            description
            hotelRetailCategory {
              code
              name
            }
            measurementUnit
          }
          additionalFeatureList {
            name
            code
            matched
            quantity
            description
            measurementUnit
          }
          layoutFeatureList {
            code
          }
          rfcRatePlanList {
            name
            code
            averageDailyRate
            totalSellingRate
            restrictionValidationList {
              code
              value
              fromDate
              toDate
            }
            ratePlan {
              code
              IsPromoted
              hotelPaymentTerm {
                name
                code
                description
              }
              hotelCancellationPolicy {
                name
                description
              }
              includedHotelExtrasList {
                id
                name
                code
                description
                includedDates
                pricingUnit
              }
            }
          }
          capacityDefault
          capacityExtra
          allocatedExtraBedAdultCount
          allocatedExtraBedChildCount
          allocatedAdultCount
          allocatedChildCount
          allocatedPetCount
          numberOfBedrooms
          space
          travelTagList {
            type
            name
            code
          }
          occasionList {
            type
            name
            code
          }
          standardFeatureList {
            name
            code
            description
            iconImageUrl
          }
        }
        availableRfcRatePlanList {
          code
          name
          averageDailyRate
          totalGrossAmount
          totalBaseAmount
          totalSellingRate
          totalBaseAmountBeforeAdjustment
          totalGrossAmountBeforeAdjustment
          adjustmentPercentage
          shouldShowStrikeThrough
          ratePlan {
            code
            name
            description
            IsPromoted
            includedHotelExtrasList {
              name
              code
              description
              pricingUnit
              includedDates
            }
          }
        }
        unavailableRfcRatePlanList {
          code
          name
          averageDailyRate
          totalGrossAmount
          totalBaseAmount
          totalSellingRate
          totalBaseAmountBeforeAdjustment
          totalGrossAmountBeforeAdjustment
          ratePlan {
            code
            name
            description
            IsPromoted
            includedHotelExtrasList {
              name
              code
              description
            }
          }
        }
      }
    }
  }
}
    `;
export const QuerySuggestedFeatureSetDocs = gql`
    query SuggestedFeatureSet($filter: SuggestedFeatureSetFilter) {
  response: suggestedFeatureSet(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelRetailFeature {
        name
        code
        description
        shortDescription
        displaySequence
        hotelRetailCategory {
          code
          name
        }
        retailFeatureImageList {
          description
          imageUrl
        }
      }
    }
  }
}
    `;
export const QuerySurchargeAmenityListDocs = gql`
    query SurchargeAmenityList($filter: HotelAmenityFilter) {
  response: surchargeAmenityList(filter: $filter) {
    count
    totalPage
    data {
      ... on HotelAmenity {
        id
        name
        code
        description
        amenityType
        pricingUnit
        iconImageUrl
        totalBaseAmount
        totalGrossAmount
        baseRate
        isePricingDisplayMode
        hotelAmenityPriceList {
          hotelAgeCategory {
            code
            name
            fromAge
            toAge
          }
          price
        }
      }
    }
  }
}
    `;
export const QueryWidgetEventFeatureRecommendationListDocs = gql`
    query WidgetEventFeatureRecommendationList($filter: WidgetEventFeatureRecommendationListFilter) {
  response: widgetEventFeatureRecommendationList(filter: $filter) {
    code
    status
    message
    data {
      ... on WidgetEventFeatureRecommendation {
        travelProfile
        event
        popularRetailFeatureList {
          id
          name
          code
          description
          shortDescription
          baseRate
          totalBaseAmount
          totalGrossAmount
          retailFeatureImageList {
            id
            description
            imageUrl
            mainImage
          }
          hotelRetailCategory {
            code
          }
          displaySequence
          matched
          quantity
          travelTag
          occasion
        }
      }
    }
  }
}
    `;