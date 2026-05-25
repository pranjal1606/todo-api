import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, } from "typeorm";
import { User } from "./User.js";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  token_hash!: string;

  @Column({ type: "timestamp" })
  expires_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  revoked_at!: Date | null;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @CreateDateColumn()
  created_at!: Date;
}
