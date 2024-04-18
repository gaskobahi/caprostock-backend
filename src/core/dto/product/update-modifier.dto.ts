import { CreateModifierDto } from './create-modifier.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdateModifierDto extends PartialType(
  OmitType(CreateModifierDto, [] as const),
) {}

/*
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
}*/
