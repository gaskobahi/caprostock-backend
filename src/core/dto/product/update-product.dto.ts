import { IsOptional, IsUUID } from 'class-validator';
import {
  CreateProductDto,
  CreateBranchToProductDto,
  CreateBundleToProductDto,
} from './create-product.dto';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, [
    //'reference',
    // 'branchToProducts',
    // 'bundleToProducts',
  ] as const),
) {
  @IsOptional()
  variantOptions: [];

  /* @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateBranchToProductDto)
  @ApiProperty({
    type: () => [UpdateBranchToProductDto],
    description: `Branches dans lesquelles le produit sera disponible`,
  })
  branchToProducts: UpdateBranchToProductDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: UpdateProductDto) => p.isBundle === true)
  @ValidateNested()
  @Type(() => UpdateBundleToProductDto)
  @ApiProperty({
    type: () => [UpdateBundleToProductDto],
    description: `Liste des produits lorsqu'il s'agit d'un pack`,
  })
  bundleToProducts: UpdateBundleToProductDto[];*/
}

export class UpdateBranchToProductDto extends PartialType(
  OmitType(CreateBranchToProductDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}

export class UpdateBundleToProductDto extends PartialType(
  OmitType(CreateBundleToProductDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
