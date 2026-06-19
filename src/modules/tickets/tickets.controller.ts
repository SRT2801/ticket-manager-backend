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

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: number; role: UserRole },
    @Body() dto: CreateTicketDto,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.create(user.id, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: { id: number; role: UserRole },
    @Query() filters: ListTicketsDto,
  ): Promise<PaginatedTicketsDto> {
    return this.ticketsService.findAll(user.id, user.role, filters);
  }

  @Get('stats')
  async getStats(
    @CurrentUser() user: { id: number; role: UserRole },
  ): Promise<{ status: TicketStatus; count: number }[]> {
    return this.ticketsService.getStats(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { id: number; role: UserRole },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(user.id, user.role, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: { id: number; role: UserRole },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.updateStatus(user.id, user.role, id, dto);
  }
}
