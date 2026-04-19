import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({default: 'user'})
    username: string;
    @ApiProperty()
    password: string;
}