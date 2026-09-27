import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { AmountDto } from './dto/amount.dto';
import { PaymentResultDto, toPaymentResult } from './dto/payment-result.dto';

@ApiTags('Платежи')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':id/debit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Списать средства с баланса пользователя',
    description:
      'Атомарно уменьшает баланс пользователя и записывает операцию в историю. ' +
      'Возвращает 400 при недостаточном балансе.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: PaymentResultDto })
  async debit(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AmountDto,
  ): Promise<PaymentResultDto> {
    const result = await this.payments.debit(id, body.amount);
    return toPaymentResult(result);
  }
}
