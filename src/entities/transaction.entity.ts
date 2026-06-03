import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { Vendor } from './vendor.entity';

export enum TransactionStatus {
  PENDING   = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED    = 'FAILED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Parties involved ---
  @Column({ type: 'varchar', length: 255 })
  studentId: string;           // references Student/AkanProfile (Team Basher's entity)

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ type: 'uuid' })
  vendorId: string;

  // --- Financial data ---
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  /* =======================================================
     DATABASE SECURITY REQUIREMENT: Immutable Audit Trail
     txnHash ensures the record cannot be tampered with.
     ======================================================= */
  @Column({ type: 'varchar', length: 255, unique: true })
  txnHash: string;             // SHA-256 hash of (studentId + vendorId + amount + timestamp)

  // --- Confirmation ---
  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}