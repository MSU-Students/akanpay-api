import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as path from 'path';
import {
  User,
  Vendor,
  VendorTransaction,
  VendorUser,
  Wallet,
  WalletLedgerEntry,
} from '../entities';
import { AuditLog } from '../wallet/audit-log.entity';

config();

const dbSync = process.env.DB_SYNC === 'true';
const isCompiled = __filename.endsWith('.js');
const migrationsDir = isCompiled
  ? path.join(__dirname, '..', 'migrations', '*.js')
  : path.join(__dirname, '..', 'migrations', '*.ts');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Vendor,
    VendorUser,
    VendorTransaction,
    Wallet,
    WalletLedgerEntry,
    AuditLog,
  ],
  migrations: [migrationsDir],
  synchronize: dbSync,
});
