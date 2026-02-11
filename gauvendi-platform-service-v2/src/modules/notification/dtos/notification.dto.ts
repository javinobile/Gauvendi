export interface EmailHistoryDto {
  id?: string;
  bookingId?: string;
  reservationId?: string;
  code: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject?: string;
  status: 'Pending' | 'Sent' | 'Failed';
  deliveredDate?: Date;
  createdDate?: Date;
  updatedDate?: Date;
}

export interface AttachmentData {
  content: string;
  filename: string;
  type: string;
  disposition?: string;
}

export interface EmailMetadata {
  hotel?: any;
  booking?: any;
  reservation?: any;
  booker?: any;
  email?: any;
  translation?: { [key: string]: string };
  bookingConfirmationUrl?: string;
  [key: string]: any;
}

export enum EmailValidationMessage {
  CPP_CONFIRMATION_EMAIL_SUCCESS = 'CPP_CONFIRMATION_EMAIL_SUCCESS',
  CONFIRMATION_EMAIL_SUCCESS = 'CONFIRMATION_EMAIL_SUCCESS',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  EMAIL_SEND_SUCCESS = 'EMAIL_SEND_SUCCESS'
}

export enum ResponseContentStatusEnum {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}

export interface ResponseContent<T = any> {
  message: {
    code: EmailValidationMessage;
    message: string;
  };
  status: ResponseContentStatusEnum;
  data?: T;
}
