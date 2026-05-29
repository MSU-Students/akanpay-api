import { Exclude } from 'class-transformer';
import { Role } from 'src/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VendorUser } from './vendor-user.entity';

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
  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.User],
  })
  roles: Role[];

  @OneToMany(() => VendorUser, (vendorUser) => vendorUser.user)
  vendorUsers: VendorUser[];
}
