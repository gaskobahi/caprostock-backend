import { PickType } from '@nestjs/swagger';
import { Brand } from '../../entities/product/brand.entity';

export class CreateBrandDto extends PickType(Brand, [
  'displayName',
  'description',
] as const) {}
