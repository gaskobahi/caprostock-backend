import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDeliveryDto } from './create-delivery.dto';

export class UpdateDeliveryDto extends PartialType(
  OmitType(CreateDeliveryDto, ['deliveryToProducts'] as const),
) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateDeliveryToProductDto)
  @ApiProperty({
    type: () => [UpdateDeliveryToProductDto],
    description: `Produits de la commande`,
  })
  deliveryToProducts: UpdateDeliveryToProductDto[];
}

export class UpdateDeliveryToProductDto extends PartialType(
  OmitType(CreateDeliveryDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
