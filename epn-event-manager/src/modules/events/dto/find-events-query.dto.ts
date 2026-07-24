import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import { EVENT_ACTIONS, EventAction } from '../event-action.enum';

export class FindEventsQueryDto {
  @IsOptional()
  @IsIn(EVENT_ACTIONS, {
    message: `action debe ser una de: ${EVENT_ACTIONS.join(', ')}`,
  })
  action?: EventAction;

  @IsOptional()
  @IsISO8601({}, { message: 'from debe ser una fecha ISO 8601 valida' })
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'to debe ser una fecha ISO 8601 valida' })
  to?: string;
}
