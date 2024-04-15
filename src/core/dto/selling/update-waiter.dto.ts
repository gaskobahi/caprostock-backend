import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWaiterDto } from './create-waiter.dto';

export class UpdateWaiterDto extends PartialType(
  OmitType(CreateWaiterDto, [] as const),
) {}
