import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { SearchService } from './search.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across all modules' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'types', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async globalSearch(
    @CurrentUser() u: any,
    @Query('q') q: string,
    @Query('types') types?: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    const typeList = types ? types.split(',') : undefined
    return this.searchService.search(u.id, q, { types: typeList, limit })
  }

  @Post('reindex')
  @ApiOperation({ summary: 'Reindex all user data in Meilisearch' })
  async reindex(@CurrentUser() u: any): Promise<any> {
    return this.searchService.reindexAll(u.id)
  }
}
