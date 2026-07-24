import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AppLogger } from '../../logger/app-logger.service';
import { InstrumentEntity } from '../../database/entities/instrument.entity';
import { EventAction } from './event-action.enum';

interface QueryFilters {
  action: string;
  id?: number;
  tipo?: string;
}

@Injectable()
export class EventsService {
  private static readonly SOURCE = 'instruments-crud';
  private static readonly ENTITY = 'Instrument';

  private readonly eventManagerUrl = process.env.EVENT_MANAGER_URL ?? 'http://localhost:3000/events';

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: AppLogger,
  ) {}

  async sendEvent(
    action: EventAction,
    title: string,
    description: string,
    payload: unknown,
  ): Promise<void> {
    try {
      const event = {
        source: EventsService.SOURCE,
        entity: EventsService.ENTITY,
        action,
        title,
        description,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      };

      await firstValueFrom(this.httpService.post(this.eventManagerUrl, event));
      this.logger.info(`Evento enviado: ${action} en ${EventsService.ENTITY}`, 'EventsService');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al enviar evento: ${message}`, undefined, 'EventsService');
    }
  }

  async onCreateInstrument(instrument: InstrumentEntity): Promise<void> {
    await this.sendEvent(
      EventAction.CREATE,
      `Instrumento creado: ${instrument.nombre}`,
      `Se creó un nuevo instrumento de tipo ${instrument.tipo}`,
      instrument,
    );
  }

  async onUpdateInstrument(oldInstrument: InstrumentEntity, newInstrument: InstrumentEntity): Promise<void> {
    await this.sendEvent(
      EventAction.UPDATE,
      `Instrumento actualizado: ${newInstrument.nombre}`,
      `Se actualizó el instrumento con ID ${newInstrument.id}`,
      { before: oldInstrument, after: newInstrument },
    );
  }

  async onDeleteInstrument(instrument: InstrumentEntity): Promise<void> {
    await this.sendEvent(
      EventAction.DELETE,
      `Instrumento eliminado: ${instrument.nombre}`,
      `Se eliminó el instrumento con ID ${instrument.id}`,
      instrument,
    );
  }

  async onQueryInstruments(count: number, filters: QueryFilters): Promise<void> {
    await this.sendEvent(
      EventAction.QUERY,
      'Consulta de instrumentos realizada',
      `Se consultaron ${count} instrumento(s)`,
      filters,
    );
  }
}
