import { IsString, IsEnum, IsOptional, IsDateString, IsNumber, Min, Max, IsUUID, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum GoalPillar { GROWTH = 'GROWTH', HEALTH = 'HEALTH', WORK = 'WORK', PERSONAL = 'PERSONAL', FINANCE = 'FINANCE' }
export enum GoalStatus { ACTIVE = 'ACTIVE', PAUSED = 'PAUSED', COMPLETED = 'COMPLETED', ARCHIVED = 'ARCHIVED' }

export class CreateGoalDto {
  @ApiProperty() @IsString() @MinLength(1) title: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ enum: GoalPillar }) @IsEnum(GoalPillar) pillar: GoalPillar
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() targetDate?: string
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() parentGoalId?: string
}

export class UpdateGoalDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false, enum: GoalPillar }) @IsOptional() @IsEnum(GoalPillar) pillar?: GoalPillar
  @ApiProperty({ required: false, enum: GoalStatus }) @IsOptional() @IsEnum(GoalStatus) status?: GoalStatus
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Max(100) progress?: number
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() targetDate?: string
}

export class CreateKeyResultDto {
  @ApiProperty() @IsString() @MinLength(1) title: string
  @ApiProperty({ enum: ['PERCENTAGE', 'NUMBER', 'BOOLEAN', 'CURRENCY'] })
  @IsEnum(['PERCENTAGE', 'NUMBER', 'BOOLEAN', 'CURRENCY']) metricType: string
  @ApiProperty() @IsNumber() targetValue: number
  @ApiProperty({ required: false }) @IsOptional() @IsString() unit?: string
}

export class UpdateKeyResultDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) currentValue?: number
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() targetValue?: number
}
