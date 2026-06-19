import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { PaginatedTicketsDto } from './dto/paginated-tickets.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { TicketStatus } from '../../common/enums/ticket.enums';
import { toZonedTime } from 'date-fns-tz';

const COLOMBIA_TIMEZONE = 'America/Bogota';

function getColombiaNow(): Date {
  const now = new Date();
  return toZonedTime(now, COLOMBIA_TIMEZONE);
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  async create(
    userId: number,
    dto: CreateTicketDto,
  ): Promise<TicketResponseDto> {
    const now = getColombiaNow();
    const ticket = this.ticketsRepository.create({
      ...dto,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    const saved = await this.ticketsRepository.save(ticket);
    return this.toResponseDto(saved);
  }

  async findAll(
    userId: number,
    userRole: UserRole,
    filters: ListTicketsDto,
  ): Promise<PaginatedTicketsDto> {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (userRole !== UserRole.ADMIN) {
      whereClause.userId = userId;
    }

    if (status) {
      whereClause.status = status;
    }

    const [tickets, total] = await this.ticketsRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { createdAt: 'ASC' },
    });

    return {
      data: tickets.map((t) => this.toResponseDto(t)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    userId: number,
    userRole: UserRole,
    ticketId: number,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.userId !== userId) {
      throw new ForbiddenException('You can only view your own tickets');
    }

    return this.toResponseDto(ticket);
  }

  async updateStatus(
    userId: number,
    userRole: UserRole,
    ticketId: number,
    dto: UpdateTicketStatusDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.userId !== userId) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    ticket.status = dto.status;
    ticket.updatedAt = getColombiaNow();
    const updated = await this.ticketsRepository.save(ticket);
    return this.toResponseDto(updated);
  }

  async updateTicket(
    userId: number,
    userRole: UserRole,
    ticketId: number,
    dto: UpdateTicketDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.userId !== userId) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    if (dto.title !== undefined) ticket.title = dto.title;
    if (dto.description !== undefined) ticket.description = dto.description;
    if (dto.priority !== undefined) ticket.priority = dto.priority;
    ticket.updatedAt = getColombiaNow();
    const updated = await this.ticketsRepository.save(ticket);
    return this.toResponseDto(updated);
  }

  async getStats(
    userId: number,
  ): Promise<{ byStatus: { status: TicketStatus; count: number }[]; recent: TicketResponseDto[] }> {
    const results = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('ticket.userId = :userId', { userId })
      .groupBy('ticket.status')
      .getRawMany();

    const recentTickets = await this.ticketsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      byStatus: results.map((r) => ({
        status: r.status as TicketStatus,
        count: parseInt(r.count, 10),
      })),
      recent: recentTickets.map((t) => this.toResponseDto(t)),
    };
  }

  private toResponseDto(ticket: Ticket): TicketResponseDto {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      userId: ticket.userId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}
