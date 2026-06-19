import { User } from '../modules/users/entities/user.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';

export const databaseConfig = () => ({
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ticket_manager',
  entities: [User, Ticket],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: true,
  synchronize: false,
});
