import type { MigrationInterface, QueryRunner } from "typeorm";

export class Init1780394884908 implements MigrationInterface {
  name = "Init1780394884908";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checklist_items" DROP CONSTRAINT "FK_ddce58fe3b634074f0eb8168d43"`
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ALTER COLUMN "task_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_db55af84c226af9dce09487b61b"`
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_e62fd181b97caa6b150b09220b1"`
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ALTER COLUMN "task_id" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ADD CONSTRAINT "FK_ddce58fe3b634074f0eb8168d43" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_db55af84c226af9dce09487b61b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_e62fd181b97caa6b150b09220b1" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_e62fd181b97caa6b150b09220b1"`
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_db55af84c226af9dce09487b61b"`
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" DROP CONSTRAINT "FK_ddce58fe3b634074f0eb8168d43"`
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ALTER COLUMN "task_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_e62fd181b97caa6b150b09220b1" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "user_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_db55af84c226af9dce09487b61b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ALTER COLUMN "task_id" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ADD CONSTRAINT "FK_ddce58fe3b634074f0eb8168d43" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
