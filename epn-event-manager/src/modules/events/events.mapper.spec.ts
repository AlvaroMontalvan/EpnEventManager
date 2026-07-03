import { EventsMapper } from './events.mapper';
import { CreateEventDto } from './dto/create-event.dto';
import { EventAction } from './event-action.enum';

describe('EventsMapper', () => {
  const recordedAt = '2026-07-03T00:00:00.000Z';

  it('maps a full DTO to event log data', () => {
    const dto: CreateEventDto = {
      source: 'instruments-crud',
      entity: 'Instrument',
      action: EventAction.CREATE,
      title: 'Instrumento creado',
      description: 'Se creó un instrumento',
      payload: { id: 1 },
    };

    const result = EventsMapper.toEventLogData(dto, recordedAt);

    expect(result).toEqual({
      source: 'instruments-crud',
      entity: 'Instrument',
      action: EventAction.CREATE,
      title: 'Instrumento creado',
      description: 'Se creó un instrumento',
      payload: JSON.stringify({ id: 1 }),
      recordedAt,
    });
  });

  it('defaults description to an empty string and payload to an empty object', () => {
    const dto: CreateEventDto = {
      source: 'instruments-crud',
      entity: 'Instrument',
      action: EventAction.QUERY,
      title: 'Consulta',
    };

    const result = EventsMapper.toEventLogData(dto, recordedAt);

    expect(result.description).toBe('');
    expect(result.payload).toBe('{}');
  });
});
