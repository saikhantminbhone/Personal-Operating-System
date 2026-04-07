import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() @MinLength(2) name: string
  @ApiProperty() @IsString() @MinLength(8) password: string
  @ApiProperty({ required: false }) @IsOptional() @IsString() timezone?: string
}

export class LoginDto {
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() password: string
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() refreshToken: string
}

export class CheckinDto {
  @ApiProperty({ minimum: 0, maximum: 3 }) energyLevel: number
}
