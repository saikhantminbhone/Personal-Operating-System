import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsDateString, IsArray, MinLength, ValidateIf } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export enum TaskStatus { TODO = 'TODO', IN_PROGRESS = 'IN_PROGRESS', DONE = 'DONE', CANCELLED = 'CANCELLED' }
export enum TaskPriority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', URGENT = 'URGENT' }

export class CreateTaskDto {
  @ApiProperty() @IsString() @MinLength(1) title: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() goalId?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() projectId?: string
  @ApiProperty({ required: false, enum: TaskPriority }) @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Max(3) energyRequired?: number
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(1) estimatedMinutes?: number
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dueDate?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() recurrenceRule?: string
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() tags?: string[]
}

export class UpdateTaskDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false, enum: TaskStatus }) @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus
  @ApiProperty({ required: false, enum: TaskPriority }) @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Max(3) energyRequired?: number
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() estimatedMinutes?: number
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dueDate?: string
  @ApiProperty({ required: false }) @IsOptional() @IsArray() tags?: string[]
  @ApiProperty({ required: false }) @IsOptional() @IsString() goalId?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() projectId?: string
  @ApiProperty({ required: false }) @IsOptional() clearDueDate?: boolean
}
