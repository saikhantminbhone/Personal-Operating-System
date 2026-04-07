import { IsString, IsOptional, IsArray, IsBoolean, IsEnum, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateNoteDto {
  @ApiProperty() @IsString() title: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() content?: string
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() collectionId?: string
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(['NOTE','DAILY','MEETING','BOOK_REVIEW','PROJECT_RETRO']) type?: string
  @ApiProperty({ required: false }) @IsOptional() @IsArray() tags?: string[]
  @ApiProperty({ required: false }) @IsOptional() @IsString() sourceUrl?: string
}

export class UpdateNoteDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() title?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() content?: string
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() collectionId?: string
  @ApiProperty({ required: false }) @IsOptional() @IsArray() tags?: string[]
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() pinned?: boolean
}

export class CreateCollectionDto {
  @ApiProperty() @IsString() name: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() color?: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() icon?: string
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() parentId?: string
}
