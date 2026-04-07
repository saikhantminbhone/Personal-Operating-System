import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { IoAdapter } from '@nestjs/platform-socket.io'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  })

  // Security
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Swagger UI in dev
    crossOriginEmbedderPolicy: false,
  }))

  app.enableCors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // WebSockets
  app.useWebSocketAdapter(new IoAdapter(app))

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra fields (more forgiving in prod)
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter())

  // Global prefix
  app.setGlobalPrefix('api/v1')

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Saikhant Labs OS — API v2')
      .setDescription(`
# Saikhant Labs Personal OS — Complete API

## Authentication
All endpoints (except /health, /auth/register, /auth/login, /billing/plans, /billing/webhook) require a Bearer JWT token.

## Modules
- **Auth** — Register, login, Google OAuth, daily check-in
- **Goals & OKRs** — Goal management with key results
- **Tasks** — Energy-matched task queue
- **Habits** — Streak tracking and habit logging
- **Finance** — Accounts, transactions, net worth
- **Knowledge** — Notes, collections, daily note
- **Projects** — Kanban, sprints, project management
- **Analytics** — Dashboard stats, trends, heatmaps
- **AI** — Daily briefing, chat assistant
- **Billing** — Stripe subscription management
- **Notifications** — Real-time notification system
- **Search** — Full-text search across all modules
      `)
      .setVersion('2.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication and user session management')
      .addTag('Goals', 'Goals and OKR tracking')
      .addTag('Tasks', 'Task management and focus queue')
      .addTag('Habits', 'Habit tracking and streaks')
      .addTag('Finance', 'Financial tracking and net worth')
      .addTag('Knowledge', 'Notes and knowledge base')
      .addTag('Projects', 'Project and sprint management')
      .addTag('Analytics', 'Dashboard stats and trends')
      .addTag('AI', 'AI assistant and daily briefing')
      .addTag('Billing', 'Stripe subscription management')
      .addTag('Notifications', 'Real-time notifications')
      .addTag('Search', 'Global search')
      .addTag('Health', 'Health check')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    })
    logger.log(`📚 Swagger docs: http://localhost:3001/api/docs`)
  }

  const port = process.env.PORT || 3001
  await app.listen(port)
  logger.log(`🚀 API running on http://localhost:${port}`)
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
}

bootstrap()
