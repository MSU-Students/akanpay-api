import { Exclude } from 'class-transformer';
import { Role } from 'src/enums';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VendorUser } from './vendor-user.entity';
import { Wallet } from './wallet.entity';
import { WalletLedgerEntry } from './wallet-ledger-entry.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ unique: true })
  username: string;
  @Column()
  @Exclude()
  password: string;
  @Column({ type: 'text', nullable: true })
  @Exclude()
  refreshTokenHash: string | null;
  @Column({ type: 'int', default: 0 })
  tokenVersion: number;
  @Column({ type: 'varchar', nullable: true })
  akanProfileId: string | null;
  @Column({ type: 'varchar', nullable: true })
  enrollmentStatus: string | null;
  @Column({ type: 'boolean', default: false })
  isStudentVerified: boolean;
  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.User],
  })
  roles: Role[];

  @OneToMany(() => VendorUser, (vendorUser) => vendorUser.user)
  vendorUsers: VendorUser[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => WalletLedgerEntry, (entry) => entry.user)
  walletLedgerEntries: WalletLedgerEntry[];
}
