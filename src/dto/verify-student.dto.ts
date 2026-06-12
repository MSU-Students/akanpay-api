import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  akanProfileId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  enrollmentStatus?: string;
}
