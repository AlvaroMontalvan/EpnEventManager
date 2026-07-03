import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EventAction } from '../../modules/events/event-action.enum';

@Entity('event_logs')
export class EventLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  source: string;

  @Index()
  @Column()
  entity: string;

  @Index()
  @Column({ type: 'varchar' })
  action: EventAction;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text' })
  payload: string;

  @Column()
  recordedAt: string;
}
