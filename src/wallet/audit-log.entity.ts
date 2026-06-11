import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', update: false })
  userId: string;

  @Column({ name: 'vendor_id', update: false, nullable: true })
  vendorId: string | null;

  @Column({ name: 'transaction_id', update: false, nullable: true })
  transactionId: string | null;

  /**
   * Using 'decimal' type for financial precision.
   * Values are handled as strings in JS to prevent rounding errors.
   */
  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    update: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    update: false,
    name: 'old_balance',
  })
  oldBalance: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    update: false,
    name: 'new_balance',
  })
  newBalance: number;

  @Column({ name: 'transaction_hash', update: false, nullable: true })
  transactionHash: string;

  /**
   * Automatically sets the timestamp on creation.
   * update: false ensures the record's creation time cannot be changed.
   */
  @CreateDateColumn({ name: 'created_at', update: false })
  createdAt: Date;
}
