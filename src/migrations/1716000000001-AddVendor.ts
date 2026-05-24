import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendor1716000000001 implements MigrationInterface {
  name = 'AddVendor1716000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vendor" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "address" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vendor_email" UNIQUE ("email"),
        CONSTRAINT "PK_vendor_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vendor"`);
  }
}
