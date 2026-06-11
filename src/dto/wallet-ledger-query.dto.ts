import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { WalletLedgerType } from 'src/enums';

export class WalletLedgerQueryDto {
  @ApiPropertyOptional({ enum: WalletLedgerType })
  @IsOptional()
  @IsEnum(WalletLedgerType)
  type?: WalletLedgerType;

  @ApiPropertyOptional({ description: 'ISO timestamp start' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp end' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
