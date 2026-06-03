
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('settlement_reports')
export class SettlementReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vendor, { eager: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ type: 'uuid' })
  vendorId: string;

  @Column({ type: 'date' })
  reportDate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalReceived: number;

  @Column({ type: 'int', default: 0 })
  txnCount: number;

  @CreateDateColumn()
  createdAt: Date;
}