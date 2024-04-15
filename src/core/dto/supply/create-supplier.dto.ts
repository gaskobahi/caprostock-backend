import { PickType } from '@nestjs/swagger';
import { Supplier } from '../../entities/supply/supplier.entity';

export class CreateSupplierDto extends PickType(Supplier, [
  'displayName',
  'description',
] as const) {}
