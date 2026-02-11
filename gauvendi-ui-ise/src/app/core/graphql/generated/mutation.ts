import gql from 'graphql-tag';

export const MutationCalculateBookingPricingDocs = gql`
    mutation CalculateBookingPricing($input: CalculateBookingPricingInput) {
  response: calculateBookingPricing(input: $input) {
    code
    status
    message
    data {
      ... on BookingPricing {
        adrSubTotal
        adrSubTotalBySetting
        averageDailyRate
        bookingAccommodationTaxAmount
        bookingAccommodationTaxList {
          id
          hotelId
          name
          code
          rate
          amount
        }
        bookingCityTaxList {
          id
          hotelId
          name
          code
          amount
          description
        }
        bookingExtraServiceTaxAmount
        bookingExtraServiceTaxList {
          id
          hotelId
          name
          code
          rate
          amount
        }
        bookingTaxList {
          id
          hotelId
          name
          code
          rate
          amount
        }
        currencyCode
        hotelId
        payAtHotelAmount
        payOnConfirmationAmount
        taxAmount
        totalBaseAmount
        totalGrossAmount
        totalSellingRate
        cityTaxAmount
        totalSellingRateBySetting
        translateTo
        reservationPricingList {
          arrival
          departure
          adults
          childrenAgeList
          index
          allocatedChildren
          allocatedAdults
          allocatedExtraChildren
          allocatedExtraAdults
          allocatedPets
          roomProductSalesPlan {
            id
            rfcId
            ratePlanId
            name
            code
            cancellationType
            guaranteeType
            totalBaseRate
            ratePlan {
              id
              code
              name
              paymentTermCode
              payAtHotel
              payOnConfirmation
              hotelCxlPolicyCode
              hourPrior
              displayUnit
              cancellationFeeValue
              cancellationFeeUnit
              description
              includedHotelExtrasList {
                id
                code
                name
                description
                amenityType
                pricingUnit
                includedDates
              }
              hotelExtrasCodeList
            }
            totalSellingRate
            totalBaseAmount
            totalBaseAmountBeforeAdjustment
            totalGrossAmount
            totalGrossAmountBeforeAdjustment
            taxAmount
            cityTaxAmount
            serviceChargeAmount
            averageDailyRate
            roomOnlySellingPrice
            adjustmentPercentage
            shouldShowStrikeThrough
          }
          amenityPricingList {
            isSalesPlanIncluded
            hotelAmenity {
              id
              code
              name
              description
              amenityType
              pricingUnit
              includedDates
              iconImageUrl
            }
            ageCategoryPricingList {
              ageCategoryCode
              fromAge
              toAge
              totalSellingRate
              count
            }
            count
            totalSellingRate
            totalBaseAmount
            totalGrossAmount
            taxAmount
            serviceChargeAmount
            averageDailyRate
            taxDetailsMap
          }
          roomProduct {
            id
            hotelId
            name
            code
            description
            capacityAdult
            capacityChildren
            rfcImageList {
              id
              rfcId
              imageUrl
              description
              displaySequence
            }
            rfcType
            numberOfBedrooms
            allocatedAdultCount
            allocatedChildCount
            allocatedExtraBedAdultCount
            allocatedExtraBedChildCount
            space
            capacityDefault
            maximumAdult
            maximumKid
            capacityExtra
            extraBedAdult
            extraBedKid
            status
            travelTag
            occasion
            retailFeatureList {
              id
              code
              name
              description
              quantity
              retailFeatureImageList {
                imageUrl
                mainImage
              }
              hotelRetailCategory {
                id
                name
                code
                displaySequence
              }
              measurementUnit
            }
            standardFeatureList {
              id
              code
              name
              description
              iconImageUrl
            }
          }
          averageDailyRate
          totalBaseAmount
          totalGrossAmount
          taxAmount
          cityTaxAmount
          payOnConfirmationAmount
          payAtHotelAmount
          totalSellingRate
          totalSellingRateBySetting
          adrSubTotal
          adrSubTotalBySetting
          accommodationTaxAmount
          accommodationTaxList {
            id
            hotelId
            name
            code
            rate
            amount
          }
          extraServiceTaxAmount
          extraServiceTaxList {
            id
            hotelId
            name
            code
            rate
            amount
          }
          totalAccommodationAmount
          totalAccommodationAmountBySetting
          averageAccommodationAmount
          hotelPaymentTerm {
            id
            hotelId
            name
            code
            payAtHotel
            payOnConfirmation
            payAtHotelDescription
            payOnConfirmationDescription
          }
          hotelCxlPolicy {
            id
            name
            description
            hourPrior
          }
          calculatedCityTax {
            propertyId
            fromDate
            toDate
            roomProductSalesPlanId
            amount
            taxBreakdown {
              id
              code
              name
              amount
            }
          }
          totalBaseAmountBeforeAdjustment
          totalGrossAmountBeforeAdjustment
          adjustmentPercentage
          shouldShowStrikeThrough
          taxDetailsMap
        }
      }
    }
  }
}
    `;
export const MutationCompleteBookingPaymentDocs = gql`
    mutation CompleteBookingPayment($paymentIntent: PaymentIntentInput, $booking: BookingInput) {
  response: completeBookingPayment(
    paymentIntent: $paymentIntent
    booking: $booking
  ) {
    code
    status
    message
    data {
      ... on Booking {
        id
        bookingNumber
        status
        totalGrossAmount
        totalBaseAmount
        taxAmount
        cityTaxAmount
        totalAdult
        totalChildren
        bookingFlow
        balance
        booker {
          address
        }
        reservationList {
          id
          reservationNumber
          rfc {
            code
            name
          }
          totalBaseAmount
          totalGrossAmount
          adult
          childrenAgeList
          matchedFeatureList {
            code
            name
          }
        }
      }
    }
  }
}
    `;
export const MutationConfirmBookingPaymentDocs = gql`
    mutation ConfirmBookingPayment($input: ConfirmBookingPaymentInput) {
  response: confirmBookingPayment(input: $input) {
    status
    code
    message
    data {
      ... on BookingPaymentResponse {
        booking {
          id
          bookingNumber
          totalBaseAmount
          taxAmount
          cityTaxAmount
          totalGrossAmount
          balance
          totalAdult
          totalChildren
          reservationList {
            reservationNumber
            adult
            childrenAgeList
            totalBaseAmount
            totalGrossAmount
            rfc {
              code
            }
            matchedFeatureList {
              code
            }
          }
        }
      }
    }
  }
}
    `;
export const MutationConfirmBookingProposalDocs = gql`
    mutation ConfirmBookingProposal($input: ConfirmBookingProposalInput) {
  response: confirmBookingProposal(input: $input) {
    code
    status
    message
    data {
      ... on ConfirmBookingResponse {
        booking {
          id
          bookingNumber
        }
        action {
          data {
            MD
            paReq
            termUrl
          }
          type
          url
          paymentData
          method
        }
      }
    }
  }
}
    `;
export const MutationDeclineProposalBookingDocs = gql`
    mutation DeclineProposalBooking($input: DeclineProposalBookingInput) {
  response: declineProposalBooking(input: $input) {
    code
    status
    message
  }
}
    `;
export const MutationGenerateTransactionDocs = gql`
    mutation GenerateTransaction($input: GenerateTransactionInput) {
  response: generateTransaction(input: $input) {
    code
    status
    message
    data {
      ... on Transaction {
        transactionId
      }
    }
  }
}
    `;
export const MutationRequestBookingDocs = gql`
    mutation RequestBooking($request: RequestBookingPaymentInput) {
  response: requestBooking(request: $request) {
    code
    status
    message
    data {
      ... on BookingPaymentResponse {
        bookingInformation {
          id
          bookingNumber
          totalGrossAmount
        }
        booking {
          id
          bookingNumber
          arrival
          departure
          totalGrossAmount
          totalBaseAmount
          totalAdult
          totalChildren
          taxAmount
          cityTaxAmount
          balance
          booker {
            emailAddress
          }
          bookingFlow
          reservationList {
            reservationNumber
            id
            rfc {
              code
              name
            }
            adult
            childrenAgeList
            totalBaseAmount
            totalGrossAmount
            matchedFeatureList {
              name
              code
            }
          }
        }
        action {
          data {
            MD
            paReq
            termUrl
          }
          type
          url
          method
          paymentData
        }
      }
    }
  }
}
    `;
export const MutationUpdateBookingInformationDocs = gql`
    mutation UpdateBookingInformation($input: BookingInput) {
  response: updateBookingInformation(input: $input) {
    code
    status
    message
  }
}
    `;