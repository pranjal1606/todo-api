import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { Task } from "./Task.js";

@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ name: "path", type: "varchar", length: 255 })
  url!: string;

  @Column({ type: "varchar", length: 100 })
  mimetype!: string;

  @Column({ type: "integer" })
  size!: number;

  @Column({ type: "integer", name: "task_id" })
  taskId!: number;

  @ManyToOne(() => Task, (task) => task.attachments, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  toJSON() {
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    return {
      id: this.id,
      filename: this.filename,
      contentType: this.mimetype,
      size: this.size,
      url: `${baseUrl}/files/${this.filename}`,
    };
  }
}
