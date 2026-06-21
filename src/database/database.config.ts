import { User } from '../modules/users/entities/user.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';

export const databaseConfig = () => {
  console.log('DATABASE_HOST=', process.env.DATABASE_HOST);
  console.log('DATABASE_PORT=', process.env.DATABASE_PORT);

  return {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    entities: [User, Ticket],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsRun: true,
    synchronize: false,
  };
};