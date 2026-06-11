import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { VendorTransaction } from './vendor-transaction.entity';
import { WalletLedgerType } from 'src/enums';

@Entity()
@Index('IDX_wallet_ledger_user_created', ['userId', 'createdAt'])
@Index('IDX_wallet_ledger_transaction', ['transactionId'])
export class WalletLedgerEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.walletLedgerEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  transactionId: number | null;

  @ManyToOne(() => VendorTransaction, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transactionId' })
  transaction: VendorTransaction | null;

  @Column({ unique: true })
  reference: string;

  @Column({
    type: 'enum',
    enum: WalletLedgerType,
  })
  type: WalletLedgerType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  availableBefore: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  availableAfter: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  pendingBefore: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  pendingAfter: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
