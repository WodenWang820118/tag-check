import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { firestore } from './firebase/firebase-firestore';
import { addDoc, collection } from 'firebase/firestore';
import { ERROR_COLLECTION } from './firebase/firebase-config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const errorMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    // Log the error to Firebase
    await this.logErrorToFirebase(exception, request, status);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }

  private async logErrorToFirebase(
    exception: unknown,
    request: Request,
    status: number
  ) {
    try {
      const errorsCollection = collection(firestore, ERROR_COLLECTION);
      await addDoc(errorsCollection, {
        timestamp: new Date(),
        exception:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method,
        status: status,
      });
    } catch (error) {
      console.error('Failed to log error to Firebase:', error);
    }
  }
}
