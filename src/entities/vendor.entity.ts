import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VendorUser } from './vendor-user.entity';
import { VendorTransaction } from './vendor-transaction.entity';

@Entity()
export class Vendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  campus: string | null;

  @OneToMany(() => VendorUser, (vendorUser) => vendorUser.vendor)
  users: VendorUser[];

  @OneToMany(() => VendorTransaction, (transaction) => transaction.vendor)
  transactions: VendorTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
