import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'
import { WinsService } from './wins.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class CreateWinDto {
  @IsString() title: string
  @IsOptional() @IsString() details?: string
  @IsOptional() @IsString() pillar?: string
  @IsOptional() @IsString() date?: string
}

@ApiTags('Wins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wins')
export class WinsController {
  constructor(private wins: WinsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wins' })
  findAll(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.wins.findAll(user.id, limit ? Number(limit) : 50)
  }

  @Post()
  @ApiOperation({ summary: 'Log a win' })
  create(@CurrentUser() user: any, @Body() dto: CreateWinDto) {
    return this.wins.create(user.id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a win' })
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.wins.delete(user.id, id)
  }
}
