import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@WebSocketGateway({
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(EventsGateway.name)
  private userSockets = new Map<string, Set<string>>() // userId -> Set of socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '')
      if (!token) { client.disconnect(); return }

      const payload = this.jwtService.verify(token, { secret: process.env.NEXTAUTH_SECRET || 'dev-secret' })
      const userId = payload.sub

      client.data.userId = userId

      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set())
      this.userSockets.get(userId)!.add(client.id)

      client.join(`user:${userId}`)
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`)

      client.emit('connected', { userId, timestamp: new Date().toISOString() })
    } catch (err) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id)
      if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId)
    }
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() })
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { channels: string[] }) {
    if (data.channels) {
      const userId = client.data.userId
      data.channels.forEach(channel => {
        if (channel.startsWith(`user:${userId}`)) client.join(channel)
      })
    }
  }

  // ── Emit helpers ────────────────────────────────────────────────────────────

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, { ...data, timestamp: new Date().toISOString() })
  }

  emitNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'notification', notification)
  }

  emitDashboardUpdate(userId: string) {
    this.emitToUser(userId, 'dashboard:update', { refresh: true })
  }

  emitTaskComplete(userId: string, taskId: string) {
    this.emitToUser(userId, 'task:completed', { taskId })
  }

  emitGoalProgress(userId: string, goalId: string, progress: number) {
    this.emitToUser(userId, 'goal:progress', { goalId, progress })
  }

  emitStreakUpdate(userId: string, streak: number) {
    this.emitToUser(userId, 'streak:update', { streak })
  }
}
