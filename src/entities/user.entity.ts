import { Role } from 'src/enums';

export interface User {
    id: number;
    name: string;
    username: string;
    password: string;
    roles?: Role[];
}