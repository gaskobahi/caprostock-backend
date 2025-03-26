import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReceptionDto } from './create-reception.dto';

export class UpdateReceptionDto extends PartialType(
  OmitType(CreateReceptionDto, ['receptionToProducts'] as const),
) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateReceptionToProductDto)
  @ApiProperty({
    type: () => [UpdateReceptionToProductDto],
    description: `Produits de la commande`,
  })
  receptionToProducts: UpdateReceptionToProductDto[];
}

export class UpdateReceptionToProductDto extends PartialType(
  OmitType(CreateReceptionDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
