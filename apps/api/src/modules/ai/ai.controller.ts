import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsArray, IsOptional } from 'class-validator'
import { AiService } from './ai.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

class ChatDto {
  @IsString() message: string
  @IsOptional() @IsArray() conversationHistory?: any[]
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
}
