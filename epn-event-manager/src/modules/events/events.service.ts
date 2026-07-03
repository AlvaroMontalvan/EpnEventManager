import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { EventLogEntity } from '../../database/entities/event-log.entity';
import { EventsMapper } from './events.mapper';
import { EventAction, EVENT_ACTIONS } from './event-action.enum';
import { AppLogger } from '../../logger/app-logger.service';
import {
  EventLogResponse,
  EventStats,
  RegisterEventResult,
} from './dto/event-log.response';

const DEFAULT_RECENT_LIMIT = 10;

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventLogEntity)
    private readonly eventLogRepository: Repository<EventLogEntity>,
    private readonly logger: AppLogger,
  ) {}

  async registerEvent(dto: CreateEventDto): Promise<RegisterEventResult> {
    const recordedAt = new Date().toISOString();
    const eventLog = EventsMapper.toEventLogData(dto, recordedAt);

    try {
      await this.eventLogRepository.save(
        this.eventLogRepository.create(eventLog),
      );
      this.logger.info(
        `Evento registrado: ${dto.action} sobre ${dto.entity}`,
        'EventsService',
      );
      return { ok: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `No se pudo registrar el evento: ${message}`,
        undefined,
        'EventsService',
      );
      return { ok: false, error: 'Error interno al persistir el evento' };
    }
  }

  async findAll(): Promise<EventLogResponse[]> {
    return this.eventLogRepository.find({ order: { recordedAt: 'ASC' } });
  }

  async findBySource(source: string): Promise<EventLogResponse[]> {
    return this.eventLogRepository.findBy({ source });
  }

  async findByEntity(entity: string): Promise<EventLogResponse[]> {
    return this.eventLogRepository.findBy({ entity });
  }

  async getStats(): Promise<EventStats> {
    const events = await this.eventLogRepository.find();

    const byAction = this.countByField(events, 'action') as Record<
      EventAction,
      number
    >;
    for (const action of EVENT_ACTIONS) {
      byAction[action] = byAction[action] ?? 0;
    }

    return {
      byAction,
      total: events.length,
      bySource: this.countByField(events, 'source'),
      generatedAt: new Date().toISOString(),
    };
  }

  async getRecentEvents(
    limit: number = DEFAULT_RECENT_LIMIT,
  ): Promise<EventLogResponse[]> {
    const safeLimit = limit > 0 ? limit : DEFAULT_RECENT_LIMIT;
    return this.eventLogRepository.find({
      order: { recordedAt: 'DESC' },
      take: safeLimit,
    });
  }

  private countByField(
    events: EventLogEntity[],
    field: 'action' | 'source',
  ): Record<string, number> {
    return events.reduce<Record<string, number>>((counts, event) => {
      const key = event[field];
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
  }
}
