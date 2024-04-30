import { ApiProperty, PickType } from '@nestjs/swagger';
import { Tax } from '../../entities/setting/tax.entity';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BranchToTax } from '../../entities/subsidiary/branch-to-tax.entity';
import { DiningToTax } from 'src/core/entities/setting/dining-to-tax.entity';
import { ProductToTax } from 'src/core/entities/setting/product-to-tax.entity';

export class CreateTaxDto extends PickType(Tax, [
  'displayName',
  'taxRate',
  'type',
  'option',
] as const) {
  @ApiProperty({
    type: () => Boolean,
    description: `boolean `,
  })
  hasDining: any;

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateTaxDto) => p.displayName != '')
  @ValidateNested()
  @Type(() => CreateBranchToTaxDto)
  @ApiProperty({
    type: () => [CreateBranchToTaxDto],
    description: `Les differentes  branch de ce tax`,
  })
  branchToTaxs: CreateBranchToTaxDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateTaxDto) => p.hasDining == true)
  @ValidateNested()
  @Type(() => CreateDiningToTaxDto)
  @ApiProperty({
    type: () => [CreateDiningToTaxDto],
    description: `Les differentes  option de restaurant de cette tax`,
  })
  diningToTaxs: CreateDiningToTaxDto[];

  @IsOptional()
  @IsArray()
  //@ValidateIf((p: CreateTaxDto) => p.hasDining == true)
  @ValidateNested()
  @Type(() => CreateProductToTaxDto)
  @ApiProperty({
    type: () => [CreateProductToTaxDto],
    description: `Les differentes  exceptions de produit de cette tax`,
  })
  productToTaxs: CreateProductToTaxDto[];
}

export class CreateBranchToTaxDto extends PickType(BranchToTax, [
  'branchId',
  'isAvailable',
] as const) {}

export class CreateDiningToTaxDto extends PickType(DiningToTax, [
  'diningId',
] as const) {}

export class CreateProductToTaxDto extends PickType(ProductToTax, [
  'productId',
] as const) {}
