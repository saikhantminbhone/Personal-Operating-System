import { Module } from '@nestjs/common'
import { WinsController } from './wins.controller'
import { WinsService } from './wins.service'

@Module({
  controllers: [WinsController],
  providers: [WinsService],
  exports: [WinsService],
})
export class WinsModule {}
