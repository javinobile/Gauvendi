export enum DataLayerKeys {
  amountWithoutTax = 'amountWithoutTax',
  bookingNumber = 'bookingNumber',
  bookingStatus = 'bookingStatus',
  checkIn = 'checkIn',
  checkOut = 'checkOut',
  cityTaxAmount = 'cityTaxAmount',
  currency = 'currency',
  currencyCode = 'currencyCode',
  customizeStay = 'customizeStay',
  ecommerce = 'ecommerce',
  hotelCode = 'hotelCode',
  hotelExtras = 'hotelExtraServices',
  numberOfNights = 'numberOfNights',
  numberOfPax = 'numberOfPax',
  numberOfRooms = 'numberOfRooms',
  occasions = 'occasions',
  pageName = 'pageName',
  payAtHotel = 'payAtHotel',
  paymentType = 'paymentType',
  payOnConfirmation = 'payOnConfirmation',
  priceFilter = 'priceFilter',
  selectedRatePlan = 'selectedRatePlan',
  selectedRoom = 'selectedRoom',
  stayOption = 'stayOption',
  totalAdults = 'totalAdults',
  totalAmount = 'totalAmount',
  totalChildren = 'totalChildren',
  travelTags = 'travelTags',
  value = 'value'
}

export enum DataLayerEvents {
  confirmBooking = 'Confirm booking',
  conversion = 'conversion',
  filterByPriceRange = 'Filter options by price range',
  makePayment = 'Make payment',
  page = 'Page',
  purchase = 'purchase',
  searchWithCustomizedFeatures = 'Search options with customized features',
  selectDateRoomAndPax = 'Select check-in date, check-out date, total rooms, total pax, travel tags and occasions',
  selectHotelExtras = 'Select hotel extra services',
  selectRecommendedOptions = 'Select recommended options'
}

// https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag
export enum GoogleTrackingEvents {
  beginCheckout = 'begin_checkout',
  purchase = 'purchase',
  selectItem = 'select_item',
  viewItem = 'view_item',
  viewItemList = 'view_item_list',
}
