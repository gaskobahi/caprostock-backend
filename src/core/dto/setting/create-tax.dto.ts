import { ApiProperty, PickType } from '@nestjs/swagger';
import { Tax } from '../../entities/setting/tax.entity';
import {
  IsArray,
  IsNotEmpty,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BranchToTax } from '../../entities/subsidiary/branch-to-tax.entity';

export class CreateTaxDto extends PickType(Tax, [
  'displayName',
  'taxRate',
  'type',
  'option',
] as const) {
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
}

export class CreateBranchToTaxDto extends PickType(BranchToTax, [
  'branchId',
  'isAvailable',
] as const) {}
