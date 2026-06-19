import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000001 implements MigrationInterface {
  name = 'InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM for UserRole
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create ENUM for TicketPriority
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ticket_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create ENUM for TicketStatus
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ticket_status_enum" AS ENUM('OPEN', 'IN_PROGRESS', 'CLOSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Create tickets table
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "priority" "ticket_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "status" "ticket_status_enum" NOT NULL DEFAULT 'OPEN',
        "user_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_tickets_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_tickets_user_id" ON "tickets" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_tickets_status" ON "tickets" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_tickets_created_at" ON "tickets" ("created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_tickets_user_id";`);
    await queryRunner.query(`DROP INDEX "idx_tickets_status";`);
    await queryRunner.query(`DROP INDEX "idx_tickets_created_at";`);
    await queryRunner.query(`DROP INDEX "idx_users_email";`);
    await queryRunner.query(`DROP TABLE "tickets";`);
    await queryRunner.query(`DROP TABLE "users";`);
    await queryRunner.query(`DROP TYPE "ticket_status_enum";`);
    await queryRunner.query(`DROP TYPE "ticket_priority_enum";`);
    await queryRunner.query(`DROP TYPE "user_role_enum";`);
  }
}
