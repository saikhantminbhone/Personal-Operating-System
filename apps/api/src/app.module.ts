import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PrismaModule } from './common/prisma/prisma.module'

import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { GoalsModule } from './modules/goals/goals.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { AiModule } from './modules/ai/ai.module'
import { HealthModule } from './modules/health/health.module'
import { HabitsModule } from './modules/habits/habits.module'
import { FinanceModule } from './modules/finance/finance.module'
import { KnowledgeModule } from './modules/knowledge/knowledge.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { BillingModule } from './modules/billing/billing.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { SearchModule } from './modules/search/search.module'
import { WebsocketsModule } from './modules/websockets/websockets.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { PublicApiModule } from './modules/public-api/public-api.module'
import { JournalModule } from './modules/journal/journal.module'
import { WinsModule } from './modules/wins/wins.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Look for .env in api folder first, then parent (project root)
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,   limit: 20 },
      { name: 'medium', ttl: 10000,  limit: 100 },
      { name: 'long',   ttl: 60000,  limit: 300 },
    ]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule, UsersModule, GoalsModule, TasksModule,
    AnalyticsModule, AiModule, HealthModule,
    HabitsModule, FinanceModule, KnowledgeModule, ProjectsModule,
    BillingModule, NotificationsModule, SearchModule, WebsocketsModule,
    OrganizationsModule, PublicApiModule,
    JournalModule, WinsModule,
  ],
})
export class AppModule {}
