/**
 * Interface for Reservation Export Data
 * 
 * Định nghĩa structure của dữ liệu reservation để export ra Excel
 */
export interface ReservationExportData {
  /** Hotel name - Tên khách sạn */
  hotelName: string;
  
  /** Reservation number - Mã đặt phòng */
  reservationNumber: string;
  
  /** Booking number - Mã booking */
  bookingNumber: string;
  
  /** Main guest - Tên khách chính */
  mainGuest: string;
  
  /** Guest email - Email khách */
  guestEmail: string;
  
  /** Guest phone - Số điện thoại khách */
  guestPhone: string;
  
  /** Company - Tên công ty */
  company: string | null;
  
  /** Company email - Email công ty */
  companyEmail: string | null;
  
  /** Arrival - Ngày đến */
  arrival: string | null;
  
  /** Departure - Ngày đi */
  departure: string | null;
  
  /** Reservation nights - Số đêm */
  reservationNights: number;
  
  /** Adults - Số người lớn */
  adults: number;
  
  /** Children ages - Số trẻ em */
  childrenAges: number;
  
  /** Pets - Số thú cưng */
  pets: number;
  
  /** Booking date - Ngày đặt phòng */
  bookingDate: string | null;
  
  /** Unit number - Số phòng */
  unitNumber: string | null;
  
  /** Product code - Mã sản phẩm */
  productCode: string;
  
  /** Product name - Tên sản phẩm */
  productName: string;
  
  /** Total revenue - Tổng doanh thu */
  totalRevenue: number;
  
  /** Paid amount - Số tiền đã thanh toán */
  paidAmount: number;
  
  /** Balance - Số tiền còn lại */
  balance: number;
  
  /** Status - Trạng thái */
  status: string;
  
  /** Booking flow - Luồng đặt phòng */
  bookingFlow: string;
  
  /** Channel - Kênh đặt phòng */
  channel: string;
  
  /** Booking source - Nguồn đặt phòng */
  bookingSource: string;
  
  /** Payment mode - Hình thức thanh toán */
  paymentMode: string;
  
  /** CXL Policy - Chính sách hủy */
  cxlPolicy: string;
  
  /** Sales plan - Gói bán hàng */
  salesPlan: string;
  
  /** Promo code - Mã giảm giá */
  promoCode: string | null;
  
  /** Reservation note - Ghi chú đặt phòng */
  reservationNote: string | null;
  
  /** Guaranteed features - Các tính năng đảm bảo */
  guaranteedFeatures: string;
  
  /** Extras - Dịch vụ thêm */
  extras: string;

  totalExtraAmount: number;
  totalAccommodationAmount: number;
  totalCityTax: number;
}
