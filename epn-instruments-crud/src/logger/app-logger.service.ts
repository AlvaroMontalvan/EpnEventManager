// MANTENIMIENTO CORRECTIVO — Alvaro Montalvan
// Logger estructurado con niveles DEBUG, INFO, WARN, ERROR y timestamps ISO 8601
//
// DEUDA TÉCNICA DOCUMENTADA (ticket C3): este archivo es una copia
// intencionalmente idéntica a epn-event-manager/src/logger/app-logger.service.ts.
// No hay una única fuente de verdad entre ambos repositorios: cualquier mejora
// futura al logger debe aplicarse manualmente en los dos lugares. Próximo paso
// recomendado: extraer esto a un paquete npm privado compartido (o a una
// carpeta /shared si se decide monorepo) para que ambos proyectos lo consuman
// desde un único origen.

import { Injectable, LoggerService } from '@nestjs/common';

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

@Injectable()
export class AppLogger implements LoggerService {
  private format(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} [${level}] ${ctx} ${message}`;
  }

  debug(message: string, context?: string): void {
    console.debug(this.format(LogLevel.DEBUG, message, context));
  }

  log(message: string, context?: string): void {
    console.log(this.format(LogLevel.INFO, message, context));
  }

  info(message: string, context?: string): void {
    this.log(message, context);
  }

  warn(message: string, context?: string): void {
    console.warn(this.format(LogLevel.WARN, message, context));
  }

  error(message: string, trace?: string, context?: string): void {
    console.error(this.format(LogLevel.ERROR, message, context));
    if (trace) {
      console.error(this.format(LogLevel.ERROR, trace, context));
    }
  }
}
