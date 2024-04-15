import { PickType } from '@nestjs/swagger';
import { Category } from '../../entities/product/category.entity';

export class CreateCategoryDto extends PickType(Category, [
  'displayName',
  'color',
] as const) {}
