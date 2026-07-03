export enum EventAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  QUERY = 'QUERY',
}

export const EVENT_ACTIONS: readonly EventAction[] = Object.values(EventAction);
