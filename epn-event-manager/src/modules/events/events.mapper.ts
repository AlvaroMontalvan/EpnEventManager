import { CreateEventDto } from './dto/create-event.dto';
import { EventAction } from './event-action.enum';
import { EventLogEntity } from '../../database/entities/event-log.entity';

export type EventLogData = Omit<EventLogEntity, 'id'>;

export class EventsMapper {
  static toEventLogData(dto: CreateEventDto, recordedAt: string): EventLogData {
    return {
      source: dto.source,
      entity: dto.entity,
      action: dto.action as EventAction,
      title: dto.title,
      description: dto.description ?? '',
      payload: JSON.stringify(dto.payload ?? {}),
      recordedAt,
    };
  }
}
