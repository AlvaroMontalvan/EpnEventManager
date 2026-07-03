import { InstrumentEntity } from '../../../database/entities/instrument.entity';

export interface InventorySummary {
  totalInstruments: number;
  totalValue: number;
  instrumentsByType: Record<string, number>;
  lowStockItems: InstrumentEntity[];
}
