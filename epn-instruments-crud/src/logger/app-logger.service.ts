// MANTENIMIENTO CORRECTIVO — Alvaro Montalvan
// Logger estructurado con niveles INFO, WARN, ERROR y timestamps ISO 8601

import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} [${level}] ${ctx} ${message}`;
  }

  debug(message: string, context?: string) {
    console.debug(this.formatMessage('DEBUG', message, context));
  }

  log(message: string, context?: string) {
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: string) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) {
      console.error(this.formatMessage('TRACE', trace, context));
    }
  }

  info(message: string, context?: string) {
    this.log(message, context);
  }
}