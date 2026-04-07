import { IsString, IsEnum, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateHabitDto {
  @ApiProperty() @IsString() title: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false, default: 'DAILY' }) @IsOptional() @IsEnum(['DAILY','WEEKLY','CUSTOM']) frequency?: string
  @ApiProperty({ required: false, type: [Number] }) @IsOptional() @IsArray() frequencyDays?: number[]
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @IsNumber() @Min(1) targetCount?: number
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string
}

export class UpdateHabitDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() order?: number
}

export class LogHabitDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() note?: string
  @ApiProperty({ required: false }) @IsOptional() completedAt?: string
}
