// MANTENIMIENTO CORRECTIVO — Alvaro Montalvan (logs estructurados)
// MANTENIMIENTO PREVENTIVO — Jonathan Cuasapaz (try-catch granular)

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstrumentEntity } from '../../database/entities/instrument.entity';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { EventsService } from '../events/events.service';
import { AppLogger } from '../../logger/app-logger.service';
import { InventorySummary } from './dto/inventory-summary';

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectRepository(InstrumentEntity)
    private readonly instrumentRepository: Repository<InstrumentEntity>,
    private readonly eventsService: EventsService,
    private readonly logger: AppLogger,
  ) {}

  async create(createInstrumentDto: CreateInstrumentDto): Promise<InstrumentEntity> {
    try {
      this.logger.info(`[CREATE] Iniciando creación: ${createInstrumentDto.nombre}`, 'InstrumentsService');

      if (createInstrumentDto.cantidad < 0) {
        this.logger.warn(`[CREATE] Cantidad negativa rechazada: ${createInstrumentDto.cantidad}`, 'InstrumentsService');
        throw new BadRequestException('La cantidad no puede ser negativa');
      }
      if (createInstrumentDto.precio < 0) {
        this.logger.warn(`[CREATE] Precio negativo rechazado: ${createInstrumentDto.precio}`, 'InstrumentsService');
        throw new BadRequestException('El precio no puede ser negativo');
      }

      const instrument = this.instrumentRepository.create(createInstrumentDto);
      const savedInstrument = await this.instrumentRepository.save(instrument);

      this.logger.info(`[CREATE] Guardado ID=${savedInstrument.id}`, 'InstrumentsService');
      await this.eventsService.onCreateInstrument(savedInstrument);
      return savedInstrument;

    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[CREATE] Error inesperado: ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al crear el instrumento');
    }
  }

  async findAll(): Promise<InstrumentEntity[]> {
    try {
      this.logger.info('[QUERY] Consultando todos los instrumentos', 'InstrumentsService');
      const instruments = await this.instrumentRepository.find();
      this.logger.info(`[QUERY] Encontrados: ${instruments.length}`, 'InstrumentsService');
      await this.eventsService.onQueryInstruments(instruments.length, { action: 'findAll' });
      return instruments;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[QUERY] Error en findAll: ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al consultar instrumentos');
    }
  }

  async findOne(id: number): Promise<InstrumentEntity> {
    try {
      this.logger.info(`[QUERY] Buscando ID=${id}`, 'InstrumentsService');
      const instrument = await this.instrumentRepository.findOne({ where: { id } });

      if (!instrument) {
        this.logger.warn(`[QUERY] ID=${id} no encontrado`, 'InstrumentsService');
        throw new NotFoundException(`Instrumento con ID ${id} no encontrado`);
      }

      this.logger.info(`[QUERY] Encontrado: "${instrument.nombre}"`, 'InstrumentsService');
      await this.eventsService.onQueryInstruments(1, { action: 'findOne', id });
      return instrument;

    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[QUERY] Error en findOne(${id}): ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al buscar el instrumento');
    }
  }

  async findByTipo(tipo: string): Promise<InstrumentEntity[]> {
    try {
      this.logger.info(`[QUERY] Buscando tipo="${tipo}"`, 'InstrumentsService');
      const instruments = await this.instrumentRepository.find({ where: { tipo } });
      this.logger.info(`[QUERY] Encontrados ${instruments.length} de tipo "${tipo}"`, 'InstrumentsService');
      await this.eventsService.onQueryInstruments(instruments.length, { action: 'findByTipo', tipo });
      return instruments;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[QUERY] Error en findByTipo: ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al buscar por tipo');
    }
  }

  async update(id: number, updateInstrumentDto: UpdateInstrumentDto): Promise<InstrumentEntity> {
    try {
      this.logger.info(`[UPDATE] Actualizando ID=${id}`, 'InstrumentsService');
      const existingInstrument = await this.findOne(id);

      if (updateInstrumentDto.cantidad !== undefined && updateInstrumentDto.cantidad < 0) {
        this.logger.warn(`[UPDATE] Cantidad negativa rechazada en ID=${id}`, 'InstrumentsService');
        throw new BadRequestException('La cantidad no puede ser negativa');
      }
      if (updateInstrumentDto.precio !== undefined && updateInstrumentDto.precio < 0) {
        this.logger.warn(`[UPDATE] Precio negativo rechazado en ID=${id}`, 'InstrumentsService');
        throw new BadRequestException('El precio no puede ser negativo');
      }

      const before = { ...existingInstrument };
      Object.assign(existingInstrument, updateInstrumentDto);
      const updatedInstrument = await this.instrumentRepository.save(existingInstrument);

      this.logger.info(`[UPDATE] ID=${id} actualizado`, 'InstrumentsService');
      await this.eventsService.onUpdateInstrument(before, updatedInstrument);
      return updatedInstrument;

    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[UPDATE] Error en update(${id}): ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al actualizar el instrumento');
    }
  }

  async remove(id: number): Promise<InstrumentEntity> {
    try {
      this.logger.info(`[DELETE] Eliminando ID=${id}`, 'InstrumentsService');
      const instrument = await this.findOne(id);
      await this.instrumentRepository.remove(instrument);

      this.logger.info(`[DELETE] "${instrument.nombre}" eliminado`, 'InstrumentsService');
      await this.eventsService.onDeleteInstrument(instrument);
      return instrument;

    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[DELETE] Error en remove(${id}): ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al eliminar el instrumento');
    }
  }

  async updateQuantity(id: number, quantityChange: number): Promise<InstrumentEntity> {
    try {
      this.logger.info(`[UPDATE] Ajuste de cantidad ID=${id} cambio=${quantityChange}`, 'InstrumentsService');
      const instrument = await this.findOne(id);
      const newQuantity = instrument.cantidad + quantityChange;

      if (newQuantity < 0) {
        this.logger.warn(`[UPDATE] Stock insuficiente ID=${id}. Disponible=${instrument.cantidad}`, 'InstrumentsService');
        throw new BadRequestException(`No hay suficiente cantidad. Disponible: ${instrument.cantidad}`);
      }

      instrument.cantidad = newQuantity;
      const updatedInstrument = await this.instrumentRepository.save(instrument);

      this.logger.info(`[UPDATE] Stock ID=${id} actualizado a ${newQuantity}`, 'InstrumentsService');
      await this.eventsService.onUpdateInstrument(instrument, updatedInstrument);
      return updatedInstrument;

    } catch (error: unknown) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[UPDATE] Error en updateQuantity(${id}): ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al actualizar la cantidad');
    }
  }

  async getInventorySummary(): Promise<InventorySummary> {
    try {
      this.logger.info('[QUERY] Generando resumen de inventario', 'InstrumentsService');
      const instruments = await this.instrumentRepository.find();

      const summary: InventorySummary = {
        totalInstruments: instruments.length,
        totalValue: instruments.reduce((sum, inst) => sum + Number(inst.precio) * inst.cantidad, 0),
        instrumentsByType: {} as Record<string, number>,
        lowStockItems: [] as InstrumentEntity[],
      };

      for (const instrument of instruments) {
        summary.instrumentsByType[instrument.tipo] = (summary.instrumentsByType[instrument.tipo] || 0) + 1;
        if (instrument.cantidad < 3) summary.lowStockItems.push(instrument);
      }

      this.logger.info(`[QUERY] Resumen: ${instruments.length} instrumentos, valor $${summary.totalValue}`, 'InstrumentsService');
      await this.eventsService.onQueryInstruments(instruments.length, { action: 'getInventorySummary' });
      return summary;

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[QUERY] Error en getInventorySummary: ${msg}`, '', 'InstrumentsService');
      throw new InternalServerErrorException('Error al generar el resumen');
    }
  }
}