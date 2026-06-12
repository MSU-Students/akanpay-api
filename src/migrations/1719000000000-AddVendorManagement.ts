import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorManagement1719000000000
  implements MigrationInterface
{
  name = 'AddVendorManagement1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'user_roles_enum' AND e.enumlabel = 'vendor'
        ) THEN
          ALTER TYPE "public"."user_roles_enum" ADD VALUE 'vendor';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'vendor_user_role_enum'
        ) THEN
          CREATE TYPE "public"."vendor_user_role_enum" AS ENUM('owner', 'staff');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'vendor_transaction_status_enum'
        ) THEN
          CREATE TYPE "public"."vendor_transaction_status_enum" AS ENUM('pending', 'success', 'failed');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "campus" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendor_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vendor_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_user" (
        "id" SERIAL NOT NULL,
        "vendorId" integer NOT NULL,
        "userId" integer NOT NULL,
        "role" "public"."vendor_user_role_enum" NOT NULL DEFAULT 'staff',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendor_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vendor_user_vendorId_userId" UNIQUE ("vendorId", "userId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_transaction" (
        "id" SERIAL NOT NULL,
        "vendorId" integer NOT NULL,
        "reference" character varying NOT NULL,
        "amount" numeric(12, 2) NOT NULL,
        "fee" numeric(12, 2) NOT NULL DEFAULT 0,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        "provider" character varying,
        "status" "public"."vendor_transaction_status_enum" NOT NULL DEFAULT 'pending',
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendor_transaction_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vendor_transaction_reference" UNIQUE ("reference")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendor_user_vendor'
        ) THEN
          ALTER TABLE "vendor_user"
          ADD CONSTRAINT "FK_vendor_user_vendor"
          FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendor_user_user'
        ) THEN
          ALTER TABLE "vendor_user"
          ADD CONSTRAINT "FK_vendor_user_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendor_transaction_vendor'
        ) THEN
          ALTER TABLE "vendor_transaction"
          ADD CONSTRAINT "FK_vendor_transaction_vendor"
          FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vendor_transaction_vendor_updated" ON "vendor_transaction" ("vendorId", "updatedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vendor_transaction_vendor_status_updated" ON "vendor_transaction" ("vendorId", "status", "updatedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vendor_transaction_vendor_paid" ON "vendor_transaction" ("vendorId", "paidAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vendor_user_vendor" ON "vendor_user" ("vendorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vendor_user_user" ON "vendor_user" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_vendor_user_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_vendor_user_vendor"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_vendor_transaction_vendor_paid"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_vendor_transaction_vendor_status_updated"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_vendor_transaction_vendor_updated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_transaction" DROP CONSTRAINT "FK_vendor_transaction_vendor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_user" DROP CONSTRAINT "FK_vendor_user_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_user" DROP CONSTRAINT "FK_vendor_user_vendor"`,
    );

    await queryRunner.query(`DROP TABLE "vendor_transaction"`);
    await queryRunner.query(`DROP TABLE "vendor_user"`);
    await queryRunner.query(`DROP TABLE "vendor"`);

    await queryRunner.query(`DROP TYPE "public"."vendor_transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."vendor_user_role_enum"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM "user"
          WHERE "roles" @> ARRAY['vendor']::"public"."user_roles_enum"[]
        ) THEN
          CREATE TYPE "public"."user_roles_enum_old" AS ENUM('user', 'admin');
          ALTER TABLE "user"
          ALTER COLUMN "roles"
          TYPE "public"."user_roles_enum_old"[]
          USING "roles"::text::"public"."user_roles_enum_old"[];
          DROP TYPE "public"."user_roles_enum";
          ALTER TYPE "public"."user_roles_enum_old" RENAME TO "user_roles_enum";
        END IF;
      END $$;
    `);
  }
}
