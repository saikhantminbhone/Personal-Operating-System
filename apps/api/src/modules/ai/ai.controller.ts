import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsArray, IsOptional, IsNumber, IsIn } from 'class-validator'
import { AiService } from './ai.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class ChatDto {
  @IsString() message: string
  @IsOptional() @IsArray() conversationHistory?: any[]
}

class CategorizeTxDto {
  @IsString() description: string
  @IsNumber() amount: number
  @IsString() type: string
}

class CategorizeNoteDto {
  @IsString() title: string
  @IsOptional() @IsString() content?: string
}

class SuggestGoalDto {
  @IsString() taskTitle: string
}

class SemanticSearchDto {
  @IsString() query: string
  @IsArray() results: any[]
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Get('briefing')
  @ApiOperation({ summary: 'Get AI-generated daily briefing' })
  getBriefing(@CurrentUser() user: any) {
    return this.ai.getDailyBriefing(user.id)
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  chat(@CurrentUser() user: any, @Body() dto: ChatDto) {
    return this.ai.chat(user.id, dto.message, dto.conversationHistory)
  }

  @Get('chat/history')
  @ApiOperation({ summary: 'Get AI chat history' })
  getHistory(@CurrentUser() user: any) {
    return this.ai.getChatHistory(user.id)
  }

  // ── Phase 2: Intelligence Layer ─────────────────────────────────────────────

  @Post('categorize/transaction')
  @ApiOperation({ summary: 'AI auto-categorize a finance transaction' })
  categorizeTransaction(@CurrentUser() user: any, @Body() dto: CategorizeTxDto) {
    return this.ai.categorizeTransaction(user.id, dto.description, dto.amount, dto.type)
  }

  @Post('categorize/note')
  @ApiOperation({ summary: 'AI suggest collection + tags for a note' })
  categorizeNote(@CurrentUser() user: any, @Body() dto: CategorizeNoteDto) {
    return this.ai.categorizeNote(user.id, dto.title, dto.content || '')
  }

  @Post('suggest/goal')
  @ApiOperation({ summary: 'AI suggest linked goal for a task' })
  suggestGoal(@CurrentUser() user: any, @Body() dto: SuggestGoalDto) {
    return this.ai.suggestGoalForTask(user.id, dto.taskTitle)
  }

  @Post('search/semantic')
  @ApiOperation({ summary: 'AI re-rank and enrich search results' })
  semanticSearch(@CurrentUser() user: any, @Body() dto: SemanticSearchDto) {
    return this.ai.semanticSearch(user.id, dto.query, dto.results)
  }
}
