import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  OFF = 'OFF',
  ON = 'ON',
}

@Entity('notification_settings')
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'public_memo',
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.ON,
  })
  publicMemo!: NotificationType;

  @Column({
    name: 'private_memo',
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.ON,
  })
  privateMemo!: NotificationType;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
