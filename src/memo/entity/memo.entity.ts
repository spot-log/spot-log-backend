import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

@Entity('memos')
export class Memo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: Visibility })
  visibility!: Visibility;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', length: 1000 })
  body!: string;

  @Column({ name: 'place_name', type: 'varchar', length: 255, nullable: true })
  placeName!: string | null;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({ name: 'trigger_radius', type: 'int', default: 100 })
  triggerRadius!: number;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
