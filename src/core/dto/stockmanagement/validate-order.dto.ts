import { PickType } from '@nestjs/swagger';
import { Order } from 'src/core/entities/stockmanagement/order.entity';

export class ValidateOrderDto extends PickType(Order, ['remark'] as const) {}
