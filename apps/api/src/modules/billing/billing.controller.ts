import { Controller, Get, Post, Body, Headers, Req, UseGuards, Param, RawBodyRequest } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { Request } from 'express'
import { BillingService } from './billing.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans') @Public() getPlans() { return this.billing.getPlans() }

  @Get('subscription') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  getSubscription(@CurrentUser() u: any) { return this.billing.getSubscription(u.id) }

  @Post('checkout') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  createCheckout(@CurrentUser() u: any, @Body() dto: { plan: 'PRO' | 'TEAM' }) {
    return this.billing.createCheckoutSession(u.id, dto.plan)
  }

  @Post('portal') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  createPortal(@CurrentUser() u: any) { return this.billing.createPortalSession(u.id) }

  @Post('webhook') @Public()
  handleWebhook(@Headers('stripe-signature') sig: string, @Req() req: RawBodyRequest<Request>) {
    return this.billing.handleWebhook(sig, req.rawBody as Buffer)
  }

  @Get('limit/:resource') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  checkLimit(@CurrentUser() u: any, @Param('resource') r: string) { return this.billing.checkLimit(u.id, r) }
}
