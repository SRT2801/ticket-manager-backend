import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { PaginatedTicketsDto } from './dto/paginated-tickets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { TicketStatus } from '../../common/enums/ticket.enums';

@ApiTags('tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo ticket' })
  @ApiResponse({
    status: 201,
    description: 'Ticket creado correctamente',
    type: TicketResponseDto,
  })
  async create(
    @CurrentUser() user: { id: number; role: UserRole },
    @Body() dto: CreateTicketDto,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de tickets',
    type: PaginatedTicketsDto,
  })
  async findAll(
    @CurrentUser() user: { id: number; role: UserRole },
    @Query() filters: ListTicketsDto,
  ): Promise<PaginatedTicketsDto> {
    return this.ticketsService.findAll(user.id, user.role, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de tickets' })
  @ApiResponse({
    status: 200,
    description: 'Lista de estadísticas por estado',
  })
  async getStats(
    @CurrentUser() user: { id: number; role: UserRole },
  ): Promise<{ status: TicketStatus; count: number }[]> {
    return this.ticketsService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un ticket' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del ticket',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async findOne(
    @CurrentUser() user: { id: number; role: UserRole },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(user.id, user.role, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de un ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket actualizado correctamente',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async updateStatus(
    @CurrentUser() user: { id: number; role: UserRole },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.updateStatus(user.id, user.role, id, dto);
  }
}
