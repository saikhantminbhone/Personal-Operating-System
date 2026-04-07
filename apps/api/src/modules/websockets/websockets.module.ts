import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EventsGateway } from './events.gateway'

@Module({
  imports: [
    JwtModule.register({ secret: process.env.NEXTAUTH_SECRET || 'dev-secret' }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebsocketsModule {}
