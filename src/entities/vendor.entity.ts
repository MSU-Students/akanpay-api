import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  businessName: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  vendorCode: string;

  @Column({ type: 'varchar', length: 255 })
  ownerName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'VENDOR' })
  role: string;

  /* =======================================================
     DATABASE SECURITY REQUIREMENT: Encryption at Rest
     GCash number is stored as AES-256-GCM ciphertext.
     ======================================================= */
  @Column({ type: 'text' })
  encryptedGcashNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
