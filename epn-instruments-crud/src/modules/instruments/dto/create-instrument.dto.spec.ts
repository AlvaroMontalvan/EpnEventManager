import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateInstrumentDto } from './create-instrument.dto';

describe('CreateInstrumentDto', () => {
  const buildValidPayload = () => ({
    nombre: 'Guitarra Yamaha C40',
    tipo: 'Cuerda',
    precio: 150,
    cantidad: 5,
  });

  it('no reporta errores con un payload válido', async () => {
    const dto = plainToInstance(CreateInstrumentDto, buildValidPayload());
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza cantidad negativa (antes validado manualmente en el service)', async () => {
    const dto = plainToInstance(CreateInstrumentDto, {
      ...buildValidPayload(),
      cantidad: -1,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'cantidad')).toBe(true);
  });

  it('rechaza precio negativo (antes validado manualmente en el service)', async () => {
    const dto = plainToInstance(CreateInstrumentDto, {
      ...buildValidPayload(),
      precio: -50,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'precio')).toBe(true);
  });

  it('acepta precio igual a cero', async () => {
    const dto = plainToInstance(CreateInstrumentDto, {
      ...buildValidPayload(),
      precio: 0,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza un tipo fuera de los valores permitidos', async () => {
    const dto = plainToInstance(CreateInstrumentDto, {
      ...buildValidPayload(),
      tipo: 'Inventado',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'tipo')).toBe(true);
  });
});
