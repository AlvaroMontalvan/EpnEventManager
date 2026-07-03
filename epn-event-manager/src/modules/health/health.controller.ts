import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    try {
      // Verificación real: si el proceso llegó aquí, NestJS y la BD están activos
      // (TypeORM lanza excepción en bootstrap si la BD no es accesible)
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message,
      };
    }
  }
}
