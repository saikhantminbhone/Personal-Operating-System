import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { FinanceService } from './finance.service'
import { CreateAccountDto, CreateTransactionDto } from './finance.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private finance: FinanceService) {}

  @Get('accounts') getAccounts(@CurrentUser() u: any) { return this.finance.getAccounts(u.id) }
  @Post('accounts') createAccount(@CurrentUser() u: any, @Body() dto: CreateAccountDto) { return this.finance.createAccount(u.id, dto) }
  @Delete('accounts/:id') deleteAccount(@CurrentUser() u: any, @Param('id') id: string) { return this.finance.deleteAccount(u.id, id) }

  @Get('transactions')
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTransactions(@CurrentUser() u: any, @Query('accountId') accountId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.finance.getTransactions(u.id, {
      accountId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
  }

  @Post('transactions') createTransaction(@CurrentUser() u: any, @Body() dto: CreateTransactionDto) { return this.finance.createTransaction(u.id, dto) }
  @Delete('transactions/:id') deleteTransaction(@CurrentUser() u: any, @Param('id') id: string) { return this.finance.deleteTransaction(u.id, id) }

  @Get('summary') getSummary(@CurrentUser() u: any, @Query('year') year?: string, @Query('month') month?: string) {
    return this.finance.getMonthlySummary(u.id, year ? parseInt(year, 10) : undefined, month !== undefined ? parseInt(month, 10) : undefined)
  }
  @Get('net-worth') getNetWorth(@CurrentUser() u: any) { return this.finance.getNetWorthHistory(u.id) }
  @Get('categories') getCategories(@CurrentUser() u: any) { return this.finance.getCategories(u.id) }
}
