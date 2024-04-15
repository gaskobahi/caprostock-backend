import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';
import { UpdateBranchToProductDto } from '../product/update-product.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBranchDto extends PartialType(
  OmitType(CreateBranchDto, ['branchToProducts'] as const),
) {
  @IsOptional()
  @IsArray()
  @ApiProperty({
    required: false,
    type: () => [UpdateBranchToProductDto],
    description: `Produits disponibles dans la branche`,
  })
  @ValidateNested()
  @Type(() => UpdateBranchToProductDto)
  branchToProducts: UpdateBranchToProductDto[];
}
