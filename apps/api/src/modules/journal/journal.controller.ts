import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator'
import { JournalService } from './journal.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class CreateEntryDto {
  @IsString() content: string
  @IsOptional() @IsNumber() @Min(1) @Max(5) mood?: number
  @IsOptional() @IsString() date?: string
}

class UpdateEntryDto {
  @IsOptional() @IsString() content?: string
  @IsOptional() @IsNumber() @Min(1) @Max(5) mood?: number
}

@ApiTags('Journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private journal: JournalService) {}

  @Get()
  @ApiOperation({ summary: 'Get journal entries' })
  findAll(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.journal.findAll(user.id, limit ? Number(limit) : 30)
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's journal entry" })
  findToday(@CurrentUser() user: any) {
    return this.journal.findToday(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a journal entry' })
  create(@CurrentUser() user: any, @Body() dto: CreateEntryDto) {
    return this.journal.create(user.id, dto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateEntryDto) {
    return this.journal.update(user.id, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry' })
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.journal.delete(user.id, id)
  }
}
