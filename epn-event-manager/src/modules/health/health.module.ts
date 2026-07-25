import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { EventLogEntity } from '../../database/entities/event-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventLogEntity])],
  controllers: [HealthController],
})
export class HealthModule {}
