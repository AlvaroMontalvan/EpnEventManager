import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventLogEntity } from './entities/event-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH ?? 'db/events.sqlite',
      entities: [EventLogEntity],
      // synchronize:true altera el esquema automáticamente según las
      // entidades en cada arranque — útil en desarrollo/tests, pero riesgoso
      // en producción (puede borrar/alterar columnas sin control ni respaldo).
      // Ver README.md → "Cambios de esquema en producción".
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
