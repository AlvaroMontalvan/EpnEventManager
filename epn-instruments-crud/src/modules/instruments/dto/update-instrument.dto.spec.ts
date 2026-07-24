import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateInstrumentDto } from './update-instrument.dto';

describe('UpdateInstrumentDto', () => {
  it('no reporta errores cuando no se envía ningún campo', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('acepta un tipo válido', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, { tipo: 'Cuerda' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza un tipo fuera de los valores permitidos', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, { tipo: 'Inventado' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'tipo')).toBe(true);
  });

  it('acepta una condicion válida', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, { condicion: 'Usado' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza una condicion fuera de los valores permitidos', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, {
      condicion: 'Como Nuevo',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'condicion')).toBe(true);
  });

  it('rechaza cantidad negativa (antes validado manualmente en el service)', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, { cantidad: -5 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'cantidad')).toBe(true);
  });

  it('rechaza precio negativo (antes validado manualmente en el service)', async () => {
    const dto = plainToInstance(UpdateInstrumentDto, { precio: -50 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'precio')).toBe(true);
  });
});
