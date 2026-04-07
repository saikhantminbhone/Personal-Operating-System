import { Module } from '@nestjs/common'
import { ApiKeysController, PublicApiController } from './public-api.controller'
import { PublicApiService } from './public-api.service'

@Module({
  controllers: [ApiKeysController, PublicApiController],
  providers: [PublicApiService],
  exports: [PublicApiService],
})
export class PublicApiModule {}
