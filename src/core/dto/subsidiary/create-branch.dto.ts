import { ApiProperty, PickType } from '@nestjs/swagger';
import { Branch } from '../../entities/subsidiary/branch.entity';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBranchToProductDto } from '../product/create-product.dto';

export class CreateBranchDto extends PickType(Branch, [
  'displayName',
  'email',
  'phoneNumber',
  'description',
  'address',
  'city',
  'isActive',
  'isParentCompany',
] as const) {
  @IsOptional()
  @IsArray()
  @ApiProperty({
    required: false,
    type: () => [CreateBranchToProductDto],
    description: `Produits disponibles dans la branche`,
  })
  @ValidateNested()
  @Type(() => CreateBranchToProductDto)
  branchToProducts: CreateBranchToProductDto[];
}
