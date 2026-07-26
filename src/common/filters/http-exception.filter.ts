import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorResponseBody {
  statusCode: number;
  message: string;
  errors: FieldError[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json(this.buildErrorResponse(exception, status));
  }

  private buildErrorResponse(
    exception: HttpException,
    status: number,
  ): ErrorResponseBody {
    if (exception instanceof ZodValidationException) {
      return {
        statusCode: status,
        message: 'Validation failed',
        errors: this.mapZodIssues(exception.getZodError()),
      };
    }

    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode: status,
        message: exceptionResponse,
        errors: [],
      };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const body = exceptionResponse as Record<string, unknown>;

      return {
        statusCode: status,
        message: this.extractMessage(body.message ?? exception.message),
        errors: [],
      };
    }

    return {
      statusCode: status,
      message: exception.message,
      errors: [],
    };
  }

  private mapZodIssues(error: unknown): FieldError[] {
    if (!(error instanceof ZodError)) {
      return [];
    }

    return error.issues.map((issue) => ({
      field: issue.path.map(String).join('.') || 'root',
      message: issue.message,
    }));
  }

  private extractMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === 'string')
        .join(', ');
    }

    return 'An error occurred';
  }
}
