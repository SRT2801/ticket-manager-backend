import { HttpStatus } from '@nestjs/common';

export class CustomException extends Error {
  public statusCode: HttpStatus;

  constructor(statusCode: HttpStatus, message?: string) {
    super(message ?? 'Error');
    this.statusCode = statusCode;
  }
}
