import { PartialType } from '@nestjs/swagger';
import { CreateInstrumentDto } from './create-instrument.dto';

// Hereda todos los campos, validaciones (@IsIn, @MaxLength, @Min, @Max) y
// metadatos de Swagger de CreateInstrumentDto, marcándolos como opcionales.
// Evita la duplicación manual que causó el bug de A2 (tipo/condicion sin
// validar en el update).
export class UpdateInstrumentDto extends PartialType(CreateInstrumentDto) {}
