import { ApiProperty, PickType } from '@nestjs/swagger';
import { Modifier } from '../../entities/product/modifier.entity';
import {
  IsArray,
  IsNotEmpty,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BranchToModifier } from '../../entities/subsidiary/branch-to-modifier.entity';
import { OptionToModifier } from 'src/core/entities/product/option-to-modifier.entity';

export class CreateModifierDto extends PickType(Modifier, [
  'displayName',
] as const) {
  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateModifierDto) => p.displayName != '')
  @ValidateNested()
  @Type(() => CreateModifierOptionDto)
  @ApiProperty({
    type: () => [CreateModifierOptionDto],
    description: `Les differents option de ce modifier`,
  })
  optionToModifiers: CreateModifierOptionDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateModifierDto) => p.displayName != '')
  @ValidateNested()
  @Type(() => CreateBranchToModifierDto)
  @ApiProperty({
    type: () => [CreateBranchToModifierDto],
    description: `Les differentes  branch de ce modifier`,
  })
  branchToModifiers: CreateBranchToModifierDto[];
}

export class CreateModifierOptionDto extends PickType(OptionToModifier, [
  'name',
  'price',
] as const) {}

export class CreateBranchToModifierDto extends PickType(BranchToModifier, [
  'branchId',
  'isAvailable',
] as const) {}
