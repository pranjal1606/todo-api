import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Task } from "./Task.js";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "boolean", default: false })
  isCompleted!: boolean;

  @ManyToOne(() => Task, (task) => task.checklistItems, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
