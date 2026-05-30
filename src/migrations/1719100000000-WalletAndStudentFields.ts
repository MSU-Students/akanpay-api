import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletAndStudentFields1719100000000
  implements MigrationInterface
{
  name = 'WalletAndStudentFields1719100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "akanProfileId" character varying,
      ADD COLUMN IF NOT EXISTS "enrollmentStatus" character varying,
      ADD COLUMN IF NOT EXISTS "isStudentVerified" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wallet" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "availableBalance" numeric(12, 2) NOT NULL DEFAULT 0,
        "pendingBalance" numeric(12, 2) NOT NULL DEFAULT 0,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallet_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallet_userId" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_wallet_user'
        ) THEN
          ALTER TABLE "wallet"
          ADD CONSTRAINT "FK_wallet_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "vendor_transaction"
      ADD COLUMN IF NOT EXISTS "studentId" integer
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_vendor_transaction_student'
        ) THEN
          ALTER TABLE "vendor_transaction"
          ADD CONSTRAINT "FK_vendor_transaction_student"
          FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vendor_transaction_student_created" ON "vendor_transaction" ("studentId", "createdAt")`,
    );

    await queryRunner.query(`
      INSERT INTO "wallet" ("userId", "availableBalance", "pendingBalance", "currency")
      SELECT "id", 0, 0, 'NGN'
      FROM "user" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "wallet" w WHERE w."userId" = u."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_vendor_transaction_student_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_transaction" DROP CONSTRAINT IF EXISTS "FK_vendor_transaction_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_transaction" DROP COLUMN IF EXISTS "studentId"`,
    );
    await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT IF EXISTS "FK_wallet_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet"`);
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "akanProfileId",
      DROP COLUMN IF EXISTS "enrollmentStatus",
      DROP COLUMN IF EXISTS "isStudentVerified"
    `);
  }
}
