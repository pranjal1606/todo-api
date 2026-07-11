import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddActivityLogIndexes1783761136580 implements MigrationInterface {
  name = "AddActivityLogIndexes1783761136580";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_d54f841fa5478e4734590d4403" ON "activity_logs"  ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_879e2d305a025dadfe9929c47d" ON "activity_logs"  ("action") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1fa31efc2a0bc0b517b9f7225d" ON "activity_logs"  ("created_at") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1fa31efc2a0bc0b517b9f7225d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_879e2d305a025dadfe9929c47d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d54f841fa5478e4734590d4403"`
    );
  }
}
