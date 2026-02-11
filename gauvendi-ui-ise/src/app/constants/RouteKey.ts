/**
 * @description
 * hotelCode: type string and should be hotel code valid in list hotel
 * currency: type string and should be currency code valid in list [USD, Euro, New Zealand dollar] config currency of whole application
 * checkInDate: type string pattern (dd-MM-yyyy) ...
 * checkOutDate: type string pattern (dd-MM-yyyy) ...
 * numberOfRoom: type string pattern (numberAdult-childrenAge-childrenAge...,numberAdult-childrenAge-childrenAge...)
 * customize: type number (1|0) verify stay options is customize or default ,
 * categories: type string pattern (category-feature-feature...,category-feature-feature...,) should be show hotel retails category and hotel retails modules
 * priceState: type number (1|0) 0: perNight | 1: perRoom
 */

export const RouterPageKey = {
  bookingConfirmation: 'booking-confirmation',
  bookingProcessing: 'booking-processing',
  bookingProposal: 'booking-proposal',
  bookingReview: 'booking-review',
  paymentConfirmation: 'payment-confirmation',
  paymentResult: 'payment-result',
  pickExtras: 'pick-extras',
  recommendation: 'recommendation',
  recommendationDetail: 'recommendation-detail',
  summaryPayment: 'summary-payment'
};

export const RouteKeyQueryParams = {
  active: 'idx', // Active Tab
  adTypes: 'adType',
  bookingFlow: 'bf',
  bookingSrc: 'bookingsrc',
  checkInDate: 'chkIn',
  checkOutDate: 'chkOut',
  combined: 'combined',
  currency: 'cur',
  customize: 'custom',
  customizeStay: 'cs',
  hotelCode: 'hc',
  includeTax: 'incTax',
  lang: 'lang',
  lowestCode: 'lc',
  lowestSalesPlan: 'lsp',
  numberOfRoom: 'nr',
  occasions: 'ocs',
  paymentId: 'pm',
  priceFilter: 'pf',
  priceState: 'ps',
  promoCode: 'promo',
  ratePlanCode: 'rpc',
  recommendationId: 'recId',
  requestId: 'reqId',
  reservationId: 'rvi',
  rfcCodes: 'rfcs',
  roomPlans: 'rp',
  roomServices: 'rs',
  roomStayOptionsCode: 'soc',
  spaceTypes: 'spcType',
  specificRoom: 'spec',
  stayOptionType: 'sot',
  travelTags: 'trt',
  utm_medium: 'utm_medium',
  utm_src: 'utm_source'
};

export const RouterKeyParams = {
  hotelCode: 'hotelCode'
};
