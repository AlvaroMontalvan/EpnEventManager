import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { EventLogEntity } from '../../database/entities/event-log.entity';
import { EventsMapper } from './events.mapper';
import { EventAction, EVENT_ACTIONS } from './event-action.enum';
import { AppLogger } from '../../logger/app-logger.service';
import { FindEventsQueryDto } from './dto/find-events-query.dto';
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

  async findAll(filters?: FindEventsQueryDto): Promise<EventLogResponse[]> {
    const where = this.buildWhereFromFilters(filters);
    const events = await this.eventLogRepository.find(
      where
        ? { where, order: { recordedAt: 'ASC' } }
        : { order: { recordedAt: 'ASC' } },
    );
    return events.map((event) => this.toResponse(event));
  }

  private buildWhereFromFilters(
    filters?: FindEventsQueryDto,
  ): FindOptionsWhere<EventLogEntity> | undefined {
    if (!filters || (!filters.action && !filters.from && !filters.to)) {
      return undefined;
    }

    const where: FindOptionsWhere<EventLogEntity> = {};

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.from && filters.to) {
      where.recordedAt = Between(filters.from, filters.to);
    } else if (filters.from) {
      where.recordedAt = MoreThanOrEqual(filters.from);
    } else if (filters.to) {
      where.recordedAt = LessThanOrEqual(filters.to);
    }

    return where;
  }

  async findBySource(source: string): Promise<EventLogResponse[]> {
    const events = await this.eventLogRepository.findBy({ source });
    return events.map((event) => this.toResponse(event));
  }

  async findByEntity(entity: string): Promise<EventLogResponse[]> {
    const events = await this.eventLogRepository.findBy({ entity });
    return events.map((event) => this.toResponse(event));
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
    const events = await this.eventLogRepository.find({
      order: { recordedAt: 'DESC' },
      take: safeLimit,
    });
    return events.map((event) => this.toResponse(event));
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

  private toResponse(event: EventLogEntity): EventLogResponse {
    return { ...event, payload: this.parsePayload(event.payload) };
  }

  private parsePayload(rawPayload: string): unknown {
    try {
      return JSON.parse(rawPayload);
    } catch {
      this.logger.warn(
        `No se pudo parsear el payload almacenado: ${rawPayload}`,
        'EventsService',
      );
      return null;
    }
  }
}
