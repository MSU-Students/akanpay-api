import { Exclude } from 'class-transformer';
import { Role } from 'src/enums';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  IDNumber: string;         // added a column

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;           // also this  

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'text', nullable: true })
  @Exclude()
  refreshTokenHash: string | null;

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.Student],  //changed user to Student by default
  })
  roles: Role[];
}