import type { MigrationInterface, QueryRunner } from "typeorm";

export class ActivityLog1783760245128 implements MigrationInterface {
  name = "ActivityLog1783760245128";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "activity_logs" ("id" SERIAL NOT NULL, "user_id" integer, "action" character varying(100) NOT NULL, "entity_type" character varying(100), "entity_id" integer, "details" jsonb, "ip_address" character varying(45), "user_agent" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d54f841fa5478e4734590d44036"`
    );
    await queryRunner.query(`DROP TABLE "activity_logs"`);
  }
}
