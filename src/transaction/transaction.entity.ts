import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentId: number;

  @Column()
  vendorId: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Column()
  referenceNo: string;

  @Column({
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
