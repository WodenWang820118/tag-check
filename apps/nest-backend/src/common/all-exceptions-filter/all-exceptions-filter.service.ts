import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  NotAcceptableException,
  InternalServerErrorException
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { addDoc, collection } from 'firebase/firestore';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly firebaseService: FirebaseService) {}
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
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

    response.code(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage
    });
  }

  private async logErrorToFirebase(
    exception: unknown,
    request: FastifyRequest,
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
            : JSON.stringify(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method,
        status: status
      });
    } catch (error) {
      Logger.error(
        'Failed to log error to Firebase:',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
