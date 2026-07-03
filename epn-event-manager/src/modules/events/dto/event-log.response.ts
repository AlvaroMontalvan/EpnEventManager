import { EventAction } from '../event-action.enum';

export interface EventLogResponse {
  id: number;
  source: string;
  entity: string;
  action: EventAction;
  title: string;
  description: string;
  payload: string;
  recordedAt: string;
}

export interface EventStats {
  byAction: Record<EventAction, number>;
  total: number;
  bySource: Record<string, number>;
  generatedAt: string;
}

export interface RegisterEventResult {
  ok: boolean;
  error?: string;
}
