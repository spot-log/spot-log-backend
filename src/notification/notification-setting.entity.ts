import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  OFF = 'OFF',
  ON = 'ON',
}

@Entity('notification_settings')
@Unique('uniq_notification_settings_user_id', ['user'])
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'public_memo',
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.OFF,
  })
  publicMemo!: NotificationType;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
