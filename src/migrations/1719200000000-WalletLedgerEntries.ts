import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletLedgerEntries1719200000000 implements MigrationInterface {
  name = 'WalletLedgerEntries1719200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'wallet_ledger_entry_type_enum'
        ) THEN
          CREATE TYPE "public"."wallet_ledger_entry_type_enum" AS ENUM(
            'credit',
            'payment_hold',
            'payment_release',
            'refund'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wallet_ledger_entry" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "transactionId" integer,
        "reference" character varying NOT NULL,
        "type" "public"."wallet_ledger_entry_type_enum" NOT NULL,
        "amount" numeric(12, 2) NOT NULL,
        "availableBefore" numeric(12, 2) NOT NULL,
        "availableAfter" numeric(12, 2) NOT NULL,
        "pendingBefore" numeric(12, 2) NOT NULL,
        "pendingAfter" numeric(12, 2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'NGN',
        "reason" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallet_ledger_entry_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallet_ledger_entry_reference" UNIQUE ("reference")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_wallet_ledger_user'
        ) THEN
          ALTER TABLE "wallet_ledger_entry"
          ADD CONSTRAINT "FK_wallet_ledger_user"
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_wallet_ledger_transaction'
        ) THEN
          ALTER TABLE "wallet_ledger_entry"
          ADD CONSTRAINT "FK_wallet_ledger_transaction"
          FOREIGN KEY ("transactionId") REFERENCES "vendor_transaction"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallet_ledger_user_created" ON "wallet_ledger_entry" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallet_ledger_transaction" ON "wallet_ledger_entry" ("transactionId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_wallet_ledger_transaction"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_wallet_ledger_user_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_ledger_entry"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."wallet_ledger_entry_type_enum"`,
    );
  }
}
