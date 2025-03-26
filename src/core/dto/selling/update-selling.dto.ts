import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateSellingDto,
  CreateSellingToProductDto,
} from './create-selling.dto';

export class UpdateSellingDto extends PartialType(
  OmitType(CreateSellingDto, [
    'reference',
    'date',
    'sellingToProducts',
  ] as const),
) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateSellingToProductDto)
  @ApiProperty({
    type: () => [UpdateSellingToProductDto],
    description: `Produits de la commande`,
  })
  sellingToProducts: UpdateSellingToProductDto[];
}

export class UpdateSellingToProductDto extends PartialType(
  OmitType(CreateSellingToProductDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ required: true })
  incoming: number;
}
