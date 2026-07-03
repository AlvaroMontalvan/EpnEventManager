import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventLogEntity } from '../../database/entities/event-log.entity';
import { AppLogger } from '../../logger/app-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventLogEntity])],
  controllers: [EventsController],
  providers: [EventsService, AppLogger],
  exports: [EventsService],
})
export class EventsModule {}
