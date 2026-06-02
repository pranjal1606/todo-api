import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Task } from "./Task.js";

@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ type: "varchar", length: 255 })
  path!: string;

  @Column({ type: "varchar", length: 100 })
  mimetype!: string;

  @Column({ type: "integer" })
  size!: number;

  @ManyToOne(() => Task, (task) => task.attachments, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @CreateDateColumn()
  createdAt!: Date;
}
