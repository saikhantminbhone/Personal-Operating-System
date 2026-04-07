import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { PrismaService } from '../../common/prisma/prisma.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() }
    } catch {
      return { status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() }
    }
  }
}
