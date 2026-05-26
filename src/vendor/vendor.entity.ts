import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  vendorCode: string; // e.g., "MSU-CAF-01"

  @Column({ type: 'varchar', length: 255 })
  ownerName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string; // Enforced encryption for authentication

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // PENDING, ACTIVE, SUSPENDED

  @Column({ type: 'varchar', length: 20, default: 'VENDOR' })
  role: string; // For Role-Based Access Control (RBAC)

  /* =======================================================
     DATABASE SECURITY REQUIREMENT: Encryption at Rest
     We store highly sensitive data as a raw text hash/cipher.
     We will use a CryptoService to encrypt/decrypt this.
     ======================================================= */
  @Column({ type: 'text' })
  encryptedBankAccount: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}