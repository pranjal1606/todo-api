import type { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeRequestsDefault1781507100000 implements MigrationInterface {
  name = "ChangeRequestsDefault1781507100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "requests" SET DEFAULT 1`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "requests" SET DEFAULT 0`
    );
  }
}
