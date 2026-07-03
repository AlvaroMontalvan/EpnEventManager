// MANTENIMIENTO PREVENTIVO — Jonathan Cuasapaz
// Sanitización rigurosa: tipos, nulos, longitudes máximas, valores permitidos

import {
  IsString, IsNumber, IsOptional, Min, Max,
  MaxLength, IsNotEmpty, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateInstrumentDto {
  @ApiProperty({ example: 'Guitarra Yamaha C40', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  nombre!: string;

  @ApiProperty({ example: 'Cuerda', enum: ['Cuerda', 'Viento', 'Percusión', 'Teclado', 'Electrónico'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Cuerda', 'Viento', 'Percusión', 'Teclado', 'Electrónico'], {
    message: 'tipo debe ser: Cuerda, Viento, Percusión, Teclado o Electrónico',
  })
  tipo!: string;

  @ApiPropertyOptional({ example: 'Yamaha', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'La marca no puede superar 50 caracteres' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  marca?: string;

  @ApiPropertyOptional({ example: 'C40', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  modelo?: string;

  @ApiProperty({ example: 150.00, minimum: 0, maximum: 99999 })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Max(99999, { message: 'El precio no puede superar 99999' })
  precio!: number;

  @ApiProperty({ example: 5, minimum: 0, maximum: 9999 })
  @IsNumber({}, { message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  @Max(9999, { message: 'La cantidad no puede superar 9999' })
  cantidad!: number;

  @ApiPropertyOptional({ example: 'Guitarra clásica ideal para principiantes', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'La descripción no puede superar 300 caracteres' })
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Nuevo', enum: ['Nuevo', 'Usado', 'Reparado'] })
  @IsOptional()
  @IsString()
  @IsIn(['Nuevo', 'Usado', 'Reparado'], {
    message: 'condicion debe ser: Nuevo, Usado o Reparado',
  })
  condicion?: string;

  @ApiPropertyOptional({ example: 'Bodega A', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  ubicacion?: string;
}