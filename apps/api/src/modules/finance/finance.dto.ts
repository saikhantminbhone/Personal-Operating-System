import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateAccountDto {
  @ApiProperty() @IsString() name: string
  @ApiProperty({ enum: ['CASH','BANK','SAVINGS','INVESTMENT','CRYPTO','CREDIT'] })
  @IsEnum(['CASH','BANK','SAVINGS','INVESTMENT','CRYPTO','CREDIT']) type: string
  @ApiProperty({ required: false, default: 'USD' }) @IsOptional() @IsString() currencyCode?: string
  @ApiProperty({ required: false, default: 0 }) @IsOptional() @IsNumber() initialBalanceCents?: number
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string
}

export class CreateTransactionDto {
  @ApiProperty() @IsString() accountId: string
  @ApiProperty() @IsNumber() amountCents: number
  @ApiProperty({ enum: ['INCOME','EXPENSE','TRANSFER'] })
  @IsEnum(['INCOME','EXPENSE','TRANSFER']) type: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() categoryId?: string
  @ApiProperty() @IsDateString() transactionDate: string
  @ApiProperty({ required: false, default: 'USD' }) @IsOptional() @IsString() currencyCode?: string
}

export class CreateBudgetDto {
  @ApiProperty() @IsString() name: string
  @ApiProperty() @IsNumber() limitCents: number
  @ApiProperty({ required: false }) @IsOptional() @IsString() categoryId?: string
  @ApiProperty({ required: false, default: 'USD' }) @IsOptional() @IsString() currencyCode?: string
}
