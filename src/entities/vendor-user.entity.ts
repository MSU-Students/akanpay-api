import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { User } from './user.entity';
import { VendorUserRole } from 'src/enums';

@Entity()
@Unique(['vendorId', 'userId'])
@Index('IDX_vendor_user_vendor', ['vendorId'])
@Index('IDX_vendor_user_user', ['userId'])
export class VendorUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vendorId: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: VendorUserRole,
    default: VendorUserRole.Staff,
  })
  role: VendorUserRole;

  @CreateDateColumn()
  createdAt: Date;
}
