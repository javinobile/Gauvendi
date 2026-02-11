import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class ValidationException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({ errorCode: 'VALIDATION_ERROR', message, errors, status: HttpStatus.BAD_REQUEST });
  }
}

export class BusinessLogicException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({
      errorCode: 'BUSINESS_LOGIC_ERROR',
      message,
      errors,
      status: HttpStatus.INTERNAL_SERVER_ERROR
    });
  }
}

export class DatabaseException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({
      errorCode: 'DATABASE_ERROR',
      message,
      errors,
      status: HttpStatus.INTERNAL_SERVER_ERROR
    });
  }
}

export class BadRequestException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({ errorCode: 'BAD_REQUEST', message, errors, status: HttpStatus.BAD_REQUEST });
  }
}

export class NotFoundException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({ errorCode: 'NOT_FOUND', message, errors, status: HttpStatus.NOT_FOUND });
  }
}

export class ConflictException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({ errorCode: 'CONFLICT', message, errors, status: HttpStatus.CONFLICT });
  }
}

export class InternalServerErrorException extends RpcException {
  constructor(message: string, errors?: any[]) {
    super({ errorCode: 'INTERNAL_SERVER_ERROR', message, errors, status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}