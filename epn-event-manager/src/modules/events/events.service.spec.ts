import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsService } from './events.service';
import { EventLogEntity } from '../../database/entities/event-log.entity';
import { AppLogger } from '../../logger/app-logger.service';
import { EventAction } from './event-action.enum';
import { CreateEventDto } from './dto/create-event.dto';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

type MockRepository = Partial<
  Record<keyof Repository<EventLogEntity>, jest.Mock>
>;

const createMockRepository = (): MockRepository => ({
  create: jest.fn((data: unknown) => data),
  save: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
});

describe('EventsService', () => {
  let service: EventsService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(EventLogEntity),
          useValue: createMockRepository(),
        },
        {
          provide: AppLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EventsService);
    repository = module.get(getRepositoryToken(EventLogEntity));
  });

  const buildDto = (
    overrides: Partial<CreateEventDto> = {},
  ): CreateEventDto => ({
    source: 'instruments-crud',
    entity: 'Instrument',
    action: EventAction.CREATE,
    title: 'Instrumento creado',
    description: 'Detalle',
    payload: { id: 1 },
    ...overrides,
  });

  describe('registerEvent', () => {
    it('persists the event and returns ok:true', async () => {
      (repository.save as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await service.registerEvent(buildDto());

      expect(result).toEqual({ ok: true });
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('returns ok:false with a message when persistence fails', async () => {
      (repository.save as jest.Mock).mockRejectedValue(new Error('disk full'));

      const result = await service.registerEvent(buildDto());

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Error interno al persistir el evento');
    });
  });

  describe('findAll', () => {
    it('returns events ordered by recordedAt ascending when no filters are given', async () => {
      const events = [{ id: 1, payload: '{"foo":"bar"}' }];
      (repository.find as jest.Mock).mockResolvedValue(events);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { recordedAt: 'ASC' },
      });
      expect(result).toEqual([{ id: 1, payload: { foo: 'bar' } }]);
    });

    it('filters by action only', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.findAll({ action: EventAction.CREATE });

      const callArgs = (repository.find as jest.Mock).mock
        .calls[0][0] as Record<string, unknown>;
      expect(callArgs).toEqual({
        where: { action: EventAction.CREATE },
        order: { recordedAt: 'ASC' },
      });
    });

    it('filters by from and to combined with action (AND, not OR)', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.findAll({
        action: EventAction.QUERY,
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      });

      const callArgs = (repository.find as jest.Mock).mock
        .calls[0][0] as Record<string, unknown>;
      const where = callArgs.where as Record<string, unknown>;
      expect(where.action).toBe(EventAction.QUERY);
      expect(where.recordedAt).toBeDefined();
    });

    it('filters by from only', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.findAll({ from: '2026-01-01T00:00:00.000Z' });

      const callArgs = (repository.find as jest.Mock).mock
        .calls[0][0] as Record<string, unknown>;
      const where = callArgs.where as Record<string, unknown>;
      expect(where.recordedAt).toBeDefined();
    });

    it('filters by to only', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.findAll({ to: '2026-01-31T23:59:59.999Z' });

      const callArgs = (repository.find as jest.Mock).mock
        .calls[0][0] as Record<string, unknown>;
      const where = callArgs.where as Record<string, unknown>;
      expect(where.recordedAt).toBeDefined();
    });
  });

  describe('findBySource / findByEntity', () => {
    it('delegates to findBy with the source filter', async () => {
      (repository.findBy as jest.Mock).mockResolvedValue([]);
      await service.findBySource('instruments-crud');
      expect(repository.findBy).toHaveBeenCalledWith({
        source: 'instruments-crud',
      });
    });

    it('delegates to findBy with the entity filter', async () => {
      (repository.findBy as jest.Mock).mockResolvedValue([]);
      await service.findByEntity('Instrument');
      expect(repository.findBy).toHaveBeenCalledWith({ entity: 'Instrument' });
    });

    it('returns payload already parsed as an object', async () => {
      (repository.findBy as jest.Mock).mockResolvedValue([
        { id: 1, payload: '{"quantity":5}' },
      ]);

      const result = await service.findBySource('instruments-crud');

      expect(result[0].payload).toEqual({ quantity: 5 });
      expect(typeof result[0].payload).not.toBe('string');
    });
  });

  describe('payload parsing', () => {
    it('returns null and logs a warning when the stored payload is not valid JSON', async () => {
      const loggerWarn = jest.spyOn(
        (service as unknown as { logger: { warn: jest.Mock } }).logger,
        'warn',
      );
      (repository.find as jest.Mock).mockResolvedValue([
        { id: 1, payload: 'esto no es json' },
      ]);

      const result = await service.findAll();

      expect(result[0].payload).toBeNull();
      expect(loggerWarn).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('aggregates totals by action and source, defaulting missing actions to zero', async () => {
      (repository.find as jest.Mock).mockResolvedValue([
        { action: EventAction.CREATE, source: 'a' },
        { action: EventAction.CREATE, source: 'b' },
        { action: EventAction.DELETE, source: 'a' },
      ]);

      const stats = await service.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byAction).toEqual({
        CREATE: 2,
        UPDATE: 0,
        DELETE: 1,
        QUERY: 0,
      });
      expect(stats.bySource).toEqual({ a: 2, b: 1 });
      expect(stats.generatedAt).toEqual(expect.any(String));
    });
  });

  describe('getRecentEvents', () => {
    it('requests events ordered by recordedAt descending with the given limit', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.getRecentEvents(5);

      expect(repository.find).toHaveBeenCalledWith({
        order: { recordedAt: 'DESC' },
        take: 5,
      });
    });

    it('falls back to the default limit when given a non-positive value', async () => {
      (repository.find as jest.Mock).mockResolvedValue([]);

      await service.getRecentEvents(0);

      expect(repository.find).toHaveBeenCalledWith({
        order: { recordedAt: 'DESC' },
        take: 10,
      });
    });
  });
});
