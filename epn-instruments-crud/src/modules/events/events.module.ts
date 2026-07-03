import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EventsService } from './events.service';
import { AppLogger } from '../../logger/app-logger.service';

@Module({
  imports: [HttpModule],
  providers: [EventsService, AppLogger],
  exports: [EventsService],
})
export class EventsModule {}
