import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLogEntity } from '../../database/entities/event-log.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(EventLogEntity)
    private readonly eventLogRepository: Repository<EventLogEntity>,
  ) {}

  @Get()
  async check() {
    try {
      // Ping real a la BD en cada llamada (no solo asumir por el bootstrap):
      // si la conexión se cae después de que el servidor ya inició, esto lo detecta.
      await this.eventLogRepository.query('SELECT 1');

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
