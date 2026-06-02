import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/User.js";
import { Category } from "../../categories/entities/Category.js";
import { ChecklistItem } from "./ChecklistItem.js";
import { Attachment } from "./Attachment.js";

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "varchar",
    length: 20,
    default: "PENDING",
  })
  status!: "PENDING" | "IN_PROGRESS" | "COMPLETED";

  @Column({
    type: "varchar",
    length: 10,
    default: "MEDIUM",
  })
  priority!: "LOW" | "MEDIUM" | "HIGH";

  @Column({ type: "timestamp", nullable: true })
  dueDate!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  reminderAt!: Date | null;

  @Column({ type: "boolean", default: false })
  reminderSent!: boolean;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Category, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "category_id" })
  category!: Category | null;

  @OneToMany(() => ChecklistItem, (item) => item.task, { cascade: true })
  checklistItems!: ChecklistItem[];

  @OneToMany(() => Attachment, (attachment) => attachment.task, {
    cascade: true,
  })
  attachments!: Attachment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true, select: false })
  deletedAt!: Date | null;
}
