import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() timezone?: string
  @IsOptional() @IsString() avatarUrl?: string
  @IsOptional() @IsNumber() @Min(0) @Max(4) energyLevel?: number
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return this.users.getProfile(user.id)
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile (name, timezone, avatarUrl, energyLevel)' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto)
  }
}
