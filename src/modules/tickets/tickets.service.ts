import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { PaginatedTicketsDto } from './dto/paginated-tickets.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { TicketStatus } from '../../common/enums/ticket.enums';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  async create(userId: number, dto: CreateTicketDto): Promise<TicketResponseDto> {
    const ticket = this.ticketsRepository.create({
      ...dto,
      userId,
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
      order: { createdAt: 'DESC' },
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

  async findOne(userId: number, userRole: UserRole, ticketId: number): Promise<TicketResponseDto> {
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
    const updated = await this.ticketsRepository.save(ticket);
    return this.toResponseDto(updated);
  }

  async getStats(userId: number): Promise<{ status: TicketStatus; count: number }[]> {
    const results = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('ticket.userId = :userId', { userId })
      .groupBy('ticket.status')
      .getRawMany();

    return results.map((r) => ({
      status: r.status as TicketStatus,
      count: parseInt(r.count, 10),
    }));
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
