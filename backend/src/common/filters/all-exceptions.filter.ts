/**
 * AllExceptionsFilter — enveloppe d'erreur API unique et stable
 * (docs/api.md §1). Aucune stack trace ni détail interne ne sort jamais.
 *
 * Mapping :
 *  - AppError (domaine) -> { statusCode, code, message, details? }
 *  - HttpException      -> { statusCode, code: HTTP_<STATUS>, message }
 *  - Prisma P2002       -> 409 CONFLICT
 *  - inconnu            -> 500 INTERNAL + log serveur uniquement
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as Request & { requestId?: string }).requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown;

    if (exception instanceof AppError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        message = 'A resource with the same unique key already exists.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'Resource not found.';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        code = 'DB_ERROR';
        message = 'A database error occurred.';
        this.logger.error(`Prisma ${exception.code}`, exception.stack);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : Array.isArray((body as { message?: unknown }).message)
            ? ((body as { message: string[] }).message.join('; '))
            : (((body as { message?: string }).message ?? exception.message));
      code = `HTTP_${status}`;
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Jamais de 500 avec fuite interne : le client reçoit un code stable.
    if (!requestId || typeof requestId !== 'string') {
      // noop — requestId optionnel hors middleware
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    });
  }
}
