import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { EventLogEntity } from '../../database/entities/event-log.entity';

describe('HealthController', () => {
  let controller: HealthController;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getRepositoryToken(EventLogEntity), useValue: { query } },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns status ok when the database ping succeeds', async () => {
    query.mockResolvedValue([{ '1': 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns status error with the failure message when the database ping fails', async () => {
    query.mockRejectedValue(new Error('connection refused'));

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect((result as { message: string }).message).toBe('connection refused');
  });

  it('returns a generic message when a non-Error value is thrown', async () => {
    query.mockRejectedValue('fallo desconocido');

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect((result as { message: string }).message).toBe('Error desconocido');
  });
});
