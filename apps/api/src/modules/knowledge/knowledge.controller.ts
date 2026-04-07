import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { KnowledgeService } from './knowledge.service'
import { CreateNoteDto, UpdateNoteDto, CreateCollectionDto } from './knowledge.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledge: KnowledgeService) {}

  @Get('notes') getNotes(@CurrentUser() u: any, @Query('collectionId') collectionId?: string, @Query('search') search?: string, @Query('page') page?: number) {
    return this.knowledge.getNotes(u.id, { collectionId, search, page })
  }
  @Get('notes/daily') getDailyNote(@CurrentUser() u: any) { return this.knowledge.getDailyNote(u.id) }
  @Get('notes/stats') getStats(@CurrentUser() u: any) { return this.knowledge.getStats(u.id) }
  @Get('notes/:id') getNote(@CurrentUser() u: any, @Param('id') id: string) { return this.knowledge.getNote(u.id, id) }
  @Post('notes') createNote(@CurrentUser() u: any, @Body() dto: CreateNoteDto) { return this.knowledge.createNote(u.id, dto) }
  @Patch('notes/:id') updateNote(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: UpdateNoteDto) { return this.knowledge.updateNote(u.id, id, dto) }
  @Delete('notes/:id') deleteNote(@CurrentUser() u: any, @Param('id') id: string) { return this.knowledge.deleteNote(u.id, id) }

  @Get('collections') getCollections(@CurrentUser() u: any) { return this.knowledge.getCollections(u.id) }
  @Post('collections') createCollection(@CurrentUser() u: any, @Body() dto: CreateCollectionDto) { return this.knowledge.createCollection(u.id, dto) }
  @Delete('collections/:id') deleteCollection(@CurrentUser() u: any, @Param('id') id: string) { return this.knowledge.deleteCollection(u.id, id) }
}
