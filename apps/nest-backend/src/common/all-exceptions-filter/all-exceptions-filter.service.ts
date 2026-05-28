import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
  Logger
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { addDoc, collection } from 'firebase/firestore';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

interface DiagnosticRequestContext {
  operation?: string;
  projectSlug?: string;
}

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestWithDiagnostics = FastifyRequest & {
  id?: string;
  diagnosticContext?: DiagnosticRequestContext;
};

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly firebaseService: FirebaseService) {}
  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<RequestWithDiagnostics>();
    let status: number;
    let errorMessage: string | object;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorMessage = exception.getResponse();
    } else {
      status = 500;
      errorMessage = 'Internal Server Error';
    }

    const requestId = this.resolveRequestId(request);
    response.header('x-request-id', requestId);

    // Log the error to Firebase in the background (fire-and-forget to avoid blocking the HTTP thread)
    void this.logErrorToFirebase(exception, request, status, requestId).catch(
      (error: unknown) => {
        Logger.error(
          'Failed to log error to Firebase:',
          error instanceof Error ? error.stack : String(error)
        );
      }
    );

    // Log to standard Nest console/Pino logger for local observability
    if (status >= 500) {
      Logger.error(
        `Unhandled Exception: ${this.getExceptionMessage(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
        'AllExceptionsFilter'
      );
    }

    response.code(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: this.sanitizePath(request.url),
      requestId,
      message: errorMessage
    });
  }

  private resolveRequestId(request: RequestWithDiagnostics): string {
    const header = request.headers['x-request-id'];
    const headerRequestId = Array.isArray(header) ? header[0] : header;
    return this.isValidClientRequestId(headerRequestId)
      ? headerRequestId
      : request.id || 'unknown-request';
  }

  private isValidClientRequestId(requestId: unknown): requestId is string {
    return typeof requestId === 'string' && REQUEST_ID_PATTERN.test(requestId);
  }

  private sanitizePath(rawUrl: string | undefined): string {
    if (!rawUrl) return '';
    try {
      return new URL(rawUrl, 'http://localhost').pathname;
    } catch {
      return rawUrl.split('?')[0] || rawUrl;
    }
  }

  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) return exception.message;
    if (typeof exception === 'string') return exception;
    return 'Unknown exception';
  }

  private async logErrorToFirebase(
    exception: unknown,
    request: FastifyRequest,
    status: number,
    requestId: string
  ) {
    try {
      const errorsCollection = collection(
        this.firebaseService.getFirestore(),
        this.firebaseService.getErrorCollectionName()
      );
      const diagnosticContext = (request as RequestWithDiagnostics)
        .diagnosticContext;
      await addDoc(errorsCollection, {
        timestamp: new Date(),
        requestId,
        method: request.method,
        path: this.sanitizePath(request.url),
        statusCode: status,
        operation: diagnosticContext?.operation,
        projectSlug: diagnosticContext?.projectSlug,
        exceptionType:
          exception instanceof Error
            ? exception.constructor.name
            : typeof exception,
        exceptionMessage: this.getExceptionMessage(exception),
        stack: exception instanceof Error ? exception.stack : undefined
      });
    } catch (error) {
      Logger.error(
        'Failed to log error to Firebase:',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }
}
