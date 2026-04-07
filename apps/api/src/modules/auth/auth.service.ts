import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../common/prisma/prisma.service'
import { RegisterDto, LoginDto, CheckinDto } from './auth.dto'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Email already registered')

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        timezone: dto.timezone || 'Asia/Bangkok',
      },
    })

    const tokens = await this.generateTokens(user.id, user.email)
    return { user: this.sanitizeUser(user), ...tokens }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email, deletedAt: null } })
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.generateTokens(user.id, user.email)
    return { user: this.sanitizeUser(user), ...tokens }
  }

  async checkin(userId: string, dto: CheckinDto) {
    if (dto.energyLevel < 0 || dto.energyLevel > 3) {
      throw new BadRequestException('Energy level must be 0-3')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()

    const today = new Date().toDateString()
    const lastCheckin = user.lastCheckinAt ? new Date(user.lastCheckinAt).toDateString() : null
    const isNewDay = lastCheckin !== today

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        energyLevel: dto.energyLevel,
        lastCheckinAt: new Date(),
        streakCount: isNewDay ? user.streakCount + 1 : user.streakCount,
      },
    })

    return {
      energyLevel: updatedUser.energyLevel,
      streakCount: updatedUser.streakCount,
      isNewDay,
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    })
    if (!user) throw new UnauthorizedException()
    return this.sanitizeUser(user)
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email }
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' })
    const refreshToken = this.jwt.sign(payload, { expiresIn: '30d' })
    return { accessToken, refreshToken }
  }

  private sanitizeUser(user: any) {
    const { passwordHash, googleId, ...safe } = user
    return safe
  }
}
