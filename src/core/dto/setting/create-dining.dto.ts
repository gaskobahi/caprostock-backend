import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Dining } from 'src/core/entities/setting/dining.entity';
import { BranchToDining } from 'src/core/entities/subsidiary/branch-to-dining.entity';

export class CreateDiningDto extends PickType(Dining, [
  'displayName',
] as const) {
  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateDiningDto) => p.displayName != '')
  @ValidateNested()
  @Type(() => CreateBranchToDiningDto)
  @ApiProperty({
    type: () => [CreateBranchToDiningDto],
    description: `Les differentes  branch de ce dining`,
  })
  branchToDinings: CreateBranchToDiningDto[];
}

export class CreateBranchToDiningDto extends PickType(BranchToDining, [
  'branchId',
  'isAvailable',
  'isDefault',
] as const) {}
