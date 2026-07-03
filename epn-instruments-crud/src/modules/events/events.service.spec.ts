import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { EventsService } from './events.service';
import { AppLogger } from '../../logger/app-logger.service';
import { EventAction } from './event-action.enum';
import { InstrumentEntity } from '../../database/entities/instrument.entity';

const buildInstrument = (overrides: Partial<InstrumentEntity> = {}): InstrumentEntity =>
  ({
    id: 1,
    nombre: 'Guitarra',
    tipo: 'Cuerda',
    precio: 100,
    cantidad: 5,
  }) as InstrumentEntity & typeof overrides;

describe('EventsService', () => {
  let service: EventsService;
  let httpService: { post: jest.Mock };
  let logger: { info: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    httpService = { post: jest.fn() };
    logger = { info: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: HttpService, useValue: httpService },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  it('sends a CREATE event with the instrument as payload', async () => {
    httpService.post.mockReturnValue(of({} as AxiosResponse));
    const instrument = buildInstrument();

    await service.onCreateInstrument(instrument);

    expect(httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ action: EventAction.CREATE, entity: 'Instrument' }),
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it('sends an UPDATE event with before/after payload', async () => {
    httpService.post.mockReturnValue(of({} as AxiosResponse));
    const before = buildInstrument({ cantidad: 5 });
    const after = buildInstrument({ cantidad: 8 });

    await service.onUpdateInstrument(before, after);

    const [, body] = httpService.post.mock.calls[0];
    expect(body.action).toBe(EventAction.UPDATE);
    expect(JSON.parse(body.payload)).toEqual({ before, after });
  });

  it('sends a DELETE event', async () => {
    httpService.post.mockReturnValue(of({} as AxiosResponse));
    const instrument = buildInstrument();

    await service.onDeleteInstrument(instrument);

    const [, body] = httpService.post.mock.calls[0];
    expect(body.action).toBe(EventAction.DELETE);
  });

  it('sends a QUERY event with the given filters', async () => {
    httpService.post.mockReturnValue(of({} as AxiosResponse));

    await service.onQueryInstruments(3, { action: 'findAll' });

    const [, body] = httpService.post.mock.calls[0];
    expect(body.action).toBe(EventAction.QUERY);
    expect(JSON.parse(body.payload)).toEqual({ action: 'findAll' });
  });

  it('forwards a string payload as-is instead of re-stringifying it', async () => {
    httpService.post.mockReturnValue(of({} as AxiosResponse));

    await service.sendEvent(EventAction.QUERY, 'title', 'description', 'already-a-string');

    const [, body] = httpService.post.mock.calls[0];
    expect(body.payload).toBe('already-a-string');
  });

  it('swallows errors from the event manager without throwing', async () => {
    httpService.post.mockReturnValue(throwError(() => new Error('connection refused')));

    await expect(service.onCreateInstrument(buildInstrument())).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
