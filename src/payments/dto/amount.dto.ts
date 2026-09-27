import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  Max,
  IsNotEmpty,
  IsDefined,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';

const DECIMAL_MAX = '9999999999999999.99';

export class AmountDto {
  @ApiProperty({
    description:
      'Сумма списания: строка или число в десятичном формате, например "100.50" или 100.5. Не более 2 знаков после запятой. Максимум 9999999999999999.99.',
    example: '100.50',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return new Prisma.Decimal(value.trim());
    if (typeof value === 'number') return new Prisma.Decimal(value);
    return value;
  })
  @IsDefined()
  @IsNotEmpty({ message: 'amount не должно быть пустым' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    {
      message:
        'amount должно быть конечным числом с не более чем 2 знаками после запятой',
    },
  )
  @IsPositive({ message: 'amount должно быть положительным' })
  @Max(Number(DECIMAL_MAX), {
    message: `amount не должно превышать ${DECIMAL_MAX}`,
  })
  amount!: Prisma.Decimal;
}
