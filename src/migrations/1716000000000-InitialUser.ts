import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialUser1716000000000 implements MigrationInterface {
  name = 'InitialUser1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'user_roles_enum'
        ) THEN
          CREATE TYPE "public"."user_roles_enum" AS ENUM('user', 'admin');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "refreshTokenHash" text,
        "tokenVersion" integer NOT NULL DEFAULT 0,
        "roles" "public"."user_roles_enum" array NOT NULL DEFAULT '{user}',
        CONSTRAINT "UQ_user_username" UNIQUE ("username"),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_roles_enum"`);
  }
}
