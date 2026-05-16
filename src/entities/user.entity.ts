import { Exclude } from 'class-transformer';
import { Role } from 'src/enums';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
    @Column({
        type: 'enum',
        enum: Role,
        array: true,
        default: [Role.User]
    })
    roles: Role[];
}