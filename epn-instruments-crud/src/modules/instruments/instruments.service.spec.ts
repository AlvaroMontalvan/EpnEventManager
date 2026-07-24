// MANTENIMIENTO PERFECTIVO — Jonathan Cuasapaz
// Suite de pruebas unitarias con Jest — valida reglas de negocio del CRUD

import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentsService } from './instruments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstrumentEntity } from '../../database/entities/instrument.entity';
import { EventsService } from '../events/events.service';
import { AppLogger } from '../../logger/app-logger.service';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

// Mock del repositorio TypeORM
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

// Mock del EventsService
const mockEventsService = {
  onCreateInstrument: jest.fn(),
  onUpdateInstrument: jest.fn(),
  onDeleteInstrument: jest.fn(),
  onQueryInstruments: jest.fn(),
};

// Mock del Logger
const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

describe('InstrumentsService — Pruebas Unitarias', () => {
  let service: InstrumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        { provide: getRepositoryToken(InstrumentEntity), useValue: mockRepository },
        { provide: EventsService, useValue: mockEventsService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<InstrumentsService>(InstrumentsService);
    jest.clearAllMocks();
  });

  // ─── CREATE ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('debe crear un instrumento válido correctamente', async () => {
      const dto = { nombre: 'Guitarra', tipo: 'Cuerda', precio: 150, cantidad: 5 };
      const savedInstrument = { id: 1, ...dto };

      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue(savedInstrument);

      const result = await service.create(dto as any);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(mockEventsService.onCreateInstrument).toHaveBeenCalledWith(savedInstrument);
    });

    // Nota (ticket B3): la validación de cantidad/precio negativos en create()
    // se eliminó del service porque ya la cubren CreateInstrumentDto (@Min(0))
    // + el ValidationPipe global — ver create-instrument.dto.spec.ts.

    it('debe aceptar precio igual a cero', async () => {
      const dto = { nombre: 'Tambor', tipo: 'Percusión', precio: 0, cantidad: 1 };
      const saved = { id: 2, ...dto };
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto as any);
      expect(result.id).toBe(2);
    });
  });

  // ─── READ ──────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('debe retornar todos los instrumentos', async () => {
      const instruments = [
        { id: 1, nombre: 'Guitarra', tipo: 'Cuerda' },
        { id: 2, nombre: 'Piano', tipo: 'Teclado' },
      ];
      mockRepository.find.mockResolvedValue(instruments);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockEventsService.onQueryInstruments).toHaveBeenCalledWith(2, { action: 'findAll' });
    });

    it('debe retornar array vacío si no hay instrumentos', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne()', () => {
    it('debe retornar el instrumento si existe', async () => {
      const instrument = { id: 1, nombre: 'Violín', tipo: 'Cuerda' };
      mockRepository.findOne.mockResolvedValue(instrument);

      const result = await service.findOne(1);
      expect(result.nombre).toBe('Violín');
    });

    it('debe lanzar NotFoundException si el ID no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe envolver un error de infraestructura en InternalServerErrorException', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB caída'));
      await expect(service.findOne(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('debe actualizar correctamente un instrumento existente', async () => {
      const existing = { id: 1, nombre: 'Guitarra', tipo: 'Cuerda', precio: 100, cantidad: 3 };
      const updateDto = { precio: 200 };
      const updated = { ...existing, precio: 200 };

      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, updateDto as any);
      expect(result.precio).toBe(200);
      expect(mockEventsService.onUpdateInstrument).toHaveBeenCalled();
    });

    // Nota (ticket B3): igual que en create(), esta validación ahora vive
    // solo en UpdateInstrumentDto + el ValidationPipe global — ver
    // update-instrument.dto.spec.ts.
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('debe eliminar un instrumento existente', async () => {
      const instrument = { id: 1, nombre: 'Trompeta', tipo: 'Viento' };
      mockRepository.findOne.mockResolvedValue(instrument);
      mockRepository.remove.mockResolvedValue(instrument);

      const result = await service.remove(1);
      expect(result.nombre).toBe('Trompeta');
      expect(mockEventsService.onDeleteInstrument).toHaveBeenCalledWith(instrument);
    });

    it('debe lanzar NotFoundException al eliminar ID inexistente', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── STOCK ─────────────────────────────────────────────────────────────────

  describe('updateQuantity()', () => {
    it('debe sumar correctamente una entrada de stock', async () => {
      const instrument = { id: 1, nombre: 'Bajo', tipo: 'Cuerda', cantidad: 5 };
      const updated = { ...instrument, cantidad: 8 };
      mockRepository.findOne.mockResolvedValue(instrument);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.updateQuantity(1, 3);
      expect(result.cantidad).toBe(8);
    });

    it('debe lanzar BadRequestException si el resultado de stock es negativo', async () => {
      const instrument = { id: 1, nombre: 'Bajo', tipo: 'Cuerda', cantidad: 2 };
      mockRepository.findOne.mockResolvedValue(instrument);

      await expect(service.updateQuantity(1, -10)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── SUMMARY ───────────────────────────────────────────────────────────────

  describe('getInventorySummary()', () => {
    it('debe calcular totales, valor y stock bajo correctamente', async () => {
      const instruments = [
        { id: 1, tipo: 'Cuerda', precio: 100, cantidad: 2 },
        { id: 2, tipo: 'Cuerda', precio: 50, cantidad: 5 },
        { id: 3, tipo: 'Viento', precio: 200, cantidad: 1 },
      ];
      mockRepository.find.mockResolvedValue(instruments);

      const summary = await service.getInventorySummary();

      expect(summary.totalInstruments).toBe(3);
      expect(summary.totalValue).toBe(100 * 2 + 50 * 5 + 200 * 1);
      expect(summary.instrumentsByType).toEqual({ Cuerda: 2, Viento: 1 });
      expect(summary.lowStockItems).toHaveLength(2);
      expect(mockEventsService.onQueryInstruments).toHaveBeenCalledWith(3, {
        action: 'getInventorySummary',
      });
    });

    it('debe respetar un umbral de bajo stock personalizado', async () => {
      const instruments = [
        { id: 1, tipo: 'Cuerda', precio: 100, cantidad: 4 },
        { id: 2, tipo: 'Cuerda', precio: 50, cantidad: 6 },
      ];
      mockRepository.find.mockResolvedValue(instruments);

      const summary = await service.getInventorySummary(5);

      expect(summary.lowStockItems).toHaveLength(1);
      expect(summary.lowStockItems[0].id).toBe(1);
    });

    it('debe usar el umbral por defecto si se envía un valor no positivo', async () => {
      const instruments = [{ id: 1, tipo: 'Cuerda', precio: 100, cantidad: 2 }];
      mockRepository.find.mockResolvedValue(instruments);

      const summary = await service.getInventorySummary(0);

      expect(summary.lowStockItems).toHaveLength(1);
    });
  });

  // ─── FIND BY TIPO ──────────────────────────────────────────────────────────

  describe('findByTipo()', () => {
    it('debe retornar los instrumentos del tipo solicitado', async () => {
      const instruments = [{ id: 1, nombre: 'Guitarra', tipo: 'Cuerda' }];
      mockRepository.find.mockResolvedValue(instruments);

      const result = await service.findByTipo('Cuerda');

      expect(result).toEqual(instruments);
      expect(mockEventsService.onQueryInstruments).toHaveBeenCalledWith(1, {
        action: 'findByTipo',
        tipo: 'Cuerda',
      });
    });
  });

  // ─── MANEJO DE ERRORES INESPERADOS ─────────────────────────────────────────

  describe('errores inesperados de infraestructura', () => {
    it('create() envuelve un error de persistencia en InternalServerErrorException', async () => {
      const dto = { nombre: 'Guitarra', tipo: 'Cuerda', precio: 150, cantidad: 5 };
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockRejectedValue(new Error('DB caída'));

      await expect(service.create(dto as any)).rejects.toThrow(InternalServerErrorException);
    });

    it('findAll() envuelve un error de consulta en InternalServerErrorException', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB caída'));
      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });

    it('findByTipo() envuelve un error de consulta en InternalServerErrorException', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB caída'));
      await expect(service.findByTipo('Cuerda')).rejects.toThrow(InternalServerErrorException);
    });

    it('update() envuelve un error de persistencia en InternalServerErrorException', async () => {
      const existing = { id: 1, nombre: 'Guitarra', tipo: 'Cuerda', precio: 100, cantidad: 3 };
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockRejectedValue(new Error('DB caída'));

      await expect(service.update(1, { precio: 200 } as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('remove() envuelve un error de infraestructura en InternalServerErrorException', async () => {
      const instrument = { id: 1, nombre: 'Trompeta', tipo: 'Viento' };
      mockRepository.findOne.mockResolvedValue(instrument);
      mockRepository.remove.mockRejectedValue(new Error('DB caída'));

      await expect(service.remove(1)).rejects.toThrow(InternalServerErrorException);
    });

    it('updateQuantity() envuelve un error de persistencia en InternalServerErrorException', async () => {
      const instrument = { id: 1, nombre: 'Bajo', tipo: 'Cuerda', cantidad: 5 };
      mockRepository.findOne.mockResolvedValue(instrument);
      mockRepository.save.mockRejectedValue(new Error('DB caída'));

      await expect(service.updateQuantity(1, 1)).rejects.toThrow(InternalServerErrorException);
    });

    it('getInventorySummary() envuelve un error de consulta en InternalServerErrorException', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB caída'));
      await expect(service.getInventorySummary()).rejects.toThrow(InternalServerErrorException);
    });

    it('maneja un valor no-Error lanzado por el repositorio', async () => {
      mockRepository.find.mockRejectedValue('fallo desconocido de bajo nivel');
      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });

    it('create() maneja un valor no-Error lanzado por el repositorio', async () => {
      const dto = { nombre: 'Guitarra', tipo: 'Cuerda', precio: 150, cantidad: 5 };
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockRejectedValue('fallo desconocido de bajo nivel');

      await expect(service.create(dto as any)).rejects.toThrow(InternalServerErrorException);
    });

    it('update() maneja un valor no-Error lanzado por el repositorio', async () => {
      const existing = { id: 1, nombre: 'Guitarra', tipo: 'Cuerda', precio: 100, cantidad: 3 };
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockRejectedValue('fallo desconocido de bajo nivel');

      await expect(service.update(1, { precio: 200 } as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('findByTipo() maneja un valor no-Error lanzado por el repositorio', async () => {
      mockRepository.find.mockRejectedValue('fallo desconocido de bajo nivel');
      await expect(service.findByTipo('Cuerda')).rejects.toThrow(InternalServerErrorException);
    });

    it('remove() maneja un valor no-Error lanzado por el repositorio', async () => {
      const instrument = { id: 1, nombre: 'Trompeta', tipo: 'Viento' };
      mockRepository.findOne.mockResolvedValue(instrument);
      mockRepository.remove.mockRejectedValue('fallo desconocido de bajo nivel');

      await expect(service.remove(1)).rejects.toThrow(InternalServerErrorException);
    });

    it('updateQuantity() maneja un valor no-Error lanzado por el repositorio', async () => {
      const instrument = { id: 1, nombre: 'Bajo', tipo: 'Cuerda', cantidad: 5 };
      mockRepository.findOne.mockResolvedValue(instrument);
      mockRepository.save.mockRejectedValue('fallo desconocido de bajo nivel');

      await expect(service.updateQuantity(1, 1)).rejects.toThrow(InternalServerErrorException);
    });

    it('getInventorySummary() maneja un valor no-Error lanzado por el repositorio', async () => {
      mockRepository.find.mockRejectedValue('fallo desconocido de bajo nivel');
      await expect(service.getInventorySummary()).rejects.toThrow(InternalServerErrorException);
    });

    it('findOne() maneja un valor no-Error lanzado por el repositorio', async () => {
      mockRepository.findOne.mockRejectedValue('fallo desconocido de bajo nivel');
      await expect(service.findOne(1)).rejects.toThrow(InternalServerErrorException);
    });
  });
});