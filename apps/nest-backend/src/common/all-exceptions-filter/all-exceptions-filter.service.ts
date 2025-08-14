import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
  NotFoundException,
  NotAcceptableException,
  InternalServerErrorException
} from '@nestjs/common';
import { Request, Response } from 'express';
import { addDoc, collection } from 'firebase/firestore';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly firebaseService: FirebaseService) {}
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status: number;
    let errorMessage: string | object;

    if (
      exception instanceof HttpException ||
      exception instanceof NotFoundException ||
      exception instanceof NotAcceptableException ||
      exception instanceof InternalServerErrorException
    ) {
      status = exception.getStatus();
      errorMessage = exception.getResponse();
    } else {
      status = 500;
      errorMessage = 'Internal Server Error';
    }

    // Log the error to Firebase
    await this.logErrorToFirebase(exception, request, status);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage
    });
  }

  private async logErrorToFirebase(
    exception: unknown,
    request: Request,
    status: number
  ) {
    try {
      const errorsCollection = collection(
        this.firebaseService.getFirestore(),
        this.firebaseService.getErrorCollectionName()
      );
      await addDoc(errorsCollection, {
        timestamp: new Date(),
        exception:
          exception instanceof Error
            ? exception.message
            : JSON.stringify(exception, null, 2),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method,
        status: status
      });
    } catch (error) {
      console.error('Failed to log error to Firebase:', error);
    }
  }
}
