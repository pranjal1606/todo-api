import type { MigrationInterface, QueryRunner } from "typeorm";

export class UserRateLimit1781507000000 implements MigrationInterface {
  name = "UserRateLimit1781507000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "requests" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "resetAt" TIMESTAMP`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "requests"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetAt"`);
  }
}
