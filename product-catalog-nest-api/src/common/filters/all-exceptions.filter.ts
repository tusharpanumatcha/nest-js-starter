import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { STATUS_CODES } from 'node:http';
import mongoose from 'mongoose';

/**
 * Every error leaves the API in the same JSON shape:
 *   { "statusCode": 404, "message": "Not Found", "errors": ["Product not found: ..."] }
 *
 * Also translates database errors: schema validation -> 422, bad cast -> 400, duplicate key -> 409.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const { status, errors } = this.describe(exception, req);

    const body: { statusCode: number; message: string; errors?: string[] } = {
      statusCode: status,
      message: STATUS_CODES[status] ?? 'Error',
    };
    if (errors.length) body.errors = errors;
    res.status(status).json(body);
  }

  private describe(
    exception: any,
    req: Request,
  ): { status: number; errors: string[] } {
    // Malformed JSON body: Nest turns the body-parser SyntaxError into a 400 with the parser's message
    if (
      exception?.type === 'entity.parse.failed' ||
      this.isJsonParseError(exception, req)
    ) {
      return { status: 400, errors: ['Request body is not valid JSON'] };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;
      let messages: unknown =
        typeof response === 'string' ? response : response?.message;
      if (
        status === HttpStatus.NOT_FOUND &&
        typeof messages === 'string' &&
        messages.startsWith('Cannot ')
      ) {
        messages = `Route not found: ${req.method} ${req.originalUrl}`;
      }
      const list = (Array.isArray(messages) ? messages : [messages])
        .filter((m): m is string => typeof m === 'string' && m.length > 0)
        .filter((m) => m !== STATUS_CODES[status]);
      return { status, errors: list };
    }
    if (exception instanceof mongoose.Error.ValidationError) {
      return {
        status: 422,
        errors: Object.values(exception.errors).map((e) =>
          e instanceof mongoose.Error.CastError
            ? `${e.path} must be a valid ${e.kind.toLowerCase()}`
            : e.message,
        ),
      };
    }
    if (exception instanceof mongoose.Error.CastError) {
      return {
        status: 400,
        errors: [
          `Invalid value for ${exception.path}: ${JSON.stringify(exception.value)}`,
        ],
      };
    }
    if (exception?.code === 11000) {
      const fields = Object.entries(exception.keyValue ?? {}).map(
        ([k, v]) => `${k} "${v}"`,
      );
      return {
        status: 409,
        errors: [`Already exists: ${fields.join(', ') || 'duplicate value'}`],
      };
    }

    this.logger.error(exception?.message ?? exception, exception?.stack);
    const errors =
      process.env.NODE_ENV !== 'production' && exception?.message
        ? [exception.message]
        : [];
    return { status: 500, errors };
  }

  private isJsonParseError(exception: unknown, req: Request): boolean {
    if (!(exception instanceof HttpException) || exception.getStatus() !== 400)
      return false;
    const message = (exception.getResponse() as any)?.message;
    return (
      typeof message === 'string' &&
      /JSON/.test(message) &&
      String(req.headers['content-type'] ?? '').includes('json')
    );
  }
}
