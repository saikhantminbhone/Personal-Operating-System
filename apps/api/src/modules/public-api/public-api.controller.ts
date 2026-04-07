import { Controller, Get, Post, Delete, Body, Param, Query, Headers, UseGuards, HttpCode } from '@nestjs/common'
import { ApiTags, ApiSecurity, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { PublicApiService } from './public-api.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'

// Management endpoints (JWT auth)
@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private publicApi: PublicApiService) {}

  @Get()    listKeys(@CurrentUser() u: any) { return this.publicApi.listKeys(u.id) }
  @Post()   createKey(@CurrentUser() u: any, @Body() dto: { name: string; scopes: string[]; expiresInDays?: number }) { return this.publicApi.createKey(u.id, dto) }
  @Delete(':id') @HttpCode(200) revokeKey(@CurrentUser() u: any, @Param('id') id: string) { return this.publicApi.revokeKey(u.id, id) }
  @Get('scopes') @Public() getScopes() { return this.publicApi.getScopes() }
}

// Public API endpoints (API key auth)
@ApiTags('Public API')
@ApiSecurity('api_key')
@Controller('public/v1')
export class PublicApiController {
  constructor(private publicApi: PublicApiService) {}

  private async auth(headers: any, scope: string) {
    const authHeader = headers.authorization || headers['x-api-key']
    const key = authHeader?.replace('Bearer ', '').replace('sk_live_', '') ? authHeader.replace('Bearer ', '') : authHeader
    return this.publicApi.validateKey(key, scope)
  }

  @Get('goals')
  @Public()
  @ApiOperation({ summary: 'List goals (Public API)' })
  async getGoals(@Headers() h: any, @Query('status') status?: string, @Query('pillar') pillar?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const { userId } = await this.auth(h, 'goals:read')
    return this.publicApi.getGoals(userId, { status, pillar, page, limit })
  }

  @Get('tasks')
  @Public()
  @ApiOperation({ summary: 'List tasks (Public API)' })
  async getTasks(@Headers() h: any, @Query('status') status?: string, @Query('priority') priority?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const { userId } = await this.auth(h, 'tasks:read')
    return this.publicApi.getTasks(userId, { status, priority, page, limit })
  }

  @Get('analytics')
  @Public()
  @ApiOperation({ summary: 'Get analytics summary (Public API)' })
  async getAnalytics(@Headers() h: any) {
    const { userId } = await this.auth(h, 'analytics:read')
    return this.publicApi.getAnalytics(userId)
  }

  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Health check for public API' })
  async ping(@Headers() h: any) {
    await this.auth(h, 'goals:read') // any valid key
    return { status: 'ok', version: 'v1', timestamp: new Date().toISOString() }
  }
}
