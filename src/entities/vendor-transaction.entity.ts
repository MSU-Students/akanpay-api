import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity';
import { TransactionStatus } from 'src/enums';
import { User } from './user.entity';

@Entity()
@Index('IDX_vendor_transaction_vendor_updated', ['vendorId', 'updatedAt'])
@Index('IDX_vendor_transaction_vendor_status_updated', [
  'vendorId',
  'status',
  'updatedAt',
])
@Index('IDX_vendor_transaction_vendor_paid', ['vendorId', 'paidAt'])
@Index('IDX_vendor_transaction_student_created', ['studentId', 'createdAt'])
export class VendorTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vendorId: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ nullable: true })
  studentId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'studentId' })
  student: User | null;

  @Column({ unique: true })
  reference: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  fee: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  provider: string | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.Pending,
  })
  status: TransactionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
