// MANTENIMIENTO PERFECTIVO — Jonathan Cuasapaz
// Decoradores ApiTags, ApiOperation y ApiResponse para documentación Swagger

import {
  Controller, Get, Post, Body, Param, Put, Delete,
  HttpCode, HttpStatus, ParseIntPipe, Query, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { InstrumentsService } from './instruments.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';

@ApiTags('instruments')
@ApiSecurity('X-FIS-EPN-KEY')
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo instrumento musical' })
  @ApiResponse({ status: 201, description: 'Instrumento creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'API Key inválida o ausente' })
  create(@Body() createInstrumentDto: CreateInstrumentDto) {
    return this.instrumentsService.create(createInstrumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los instrumentos' })
  @ApiResponse({ status: 200, description: 'Lista de instrumentos' })
  findAll() {
    return this.instrumentsService.findAll();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obtener resumen del inventario' })
  @ApiResponse({ status: 200, description: 'Resumen con totales y stock bajo' })
  @ApiQuery({
    name: 'lowStockThreshold',
    type: Number,
    required: false,
    description: 'Umbral de bajo stock (por defecto 3)',
  })
  getInventorySummary(
    @Query('lowStockThreshold', new DefaultValuePipe(3), ParseIntPipe)
    lowStockThreshold: number,
  ) {
    return this.instrumentsService.getInventorySummary(lowStockThreshold);
  }

  @Get('type/:tipo')
  @ApiOperation({ summary: 'Obtener instrumentos por tipo' })
  @ApiParam({ name: 'tipo', example: 'Cuerda' })
  findByTipo(@Param('tipo') tipo: string) {
    return this.instrumentsService.findByTipo(tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un instrumento por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 404, description: 'Instrumento no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.instrumentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un instrumento' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstrumentDto: UpdateInstrumentDto,
  ) {
    return this.instrumentsService.update(id, updateInstrumentDto);
  }

  @Put(':id/quantity')
  @ApiOperation({ summary: 'Ajustar cantidad en stock' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'change', type: Number, description: 'Positivo para entrada, negativo para salida' })
  updateQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Query('change', ParseIntPipe) change: number,
  ) {
    return this.instrumentsService.updateQuantity(id, change);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un instrumento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Instrumento eliminado' })
  @ApiResponse({ status: 404, description: 'Instrumento no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.instrumentsService.remove(id);
  }
}
