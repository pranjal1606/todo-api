import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../auth/entities/User.js";

@Entity("activity_logs")
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: "integer", name: "user_id", nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Index()
  @Column({ type: "varchar", length: 100 })
  action!: string;

  @Column({ type: "varchar", length: 100, name: "entity_type", nullable: true })
  entityType!: string | null;

  @Column({ type: "integer", name: "entity_id", nullable: true })
  entityId!: number | null;

  @Column({ type: "jsonb", nullable: true })
  details!: any;

  @Column({ type: "varchar", length: 45, name: "ip_address", nullable: true })
  ipAddress!: string | null;

  @Column({ type: "varchar", length: 255, name: "user_agent", nullable: true })
  userAgent!: string | null;

  @Index()
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
