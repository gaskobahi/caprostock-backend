import { PickType } from '@nestjs/swagger';
import { Order } from 'src/core/entities/supply/order.entity';

export class ValidateOrderDto extends PickType(Order, ['remark'] as const) {}
