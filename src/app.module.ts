import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { databaseConfig } from './database/database.config';
import { jwtConfig } from './config/auth/jwt.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SeedService } from './database/seed.service';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    TypeOrmModule.forRoot(databaseConfig()),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UsersModule,
    TicketsModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    SeedService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
