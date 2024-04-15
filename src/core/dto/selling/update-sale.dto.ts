import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleDto, CreateSaleToProductDto } from './create-sale.dto';

export class UpdateSaleDto extends PartialType(
  OmitType(CreateSaleDto, ['saleToProducts'] as const),
) {
  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSaleToProductDto)
  @ApiProperty({
    type: () => [UpdateSaleToProductDto],
    description: `Produits de la commande`,
  })
  saleToProducts: UpdateSaleToProductDto[];
}

export class UpdateSaleToProductDto extends PartialType(
  OmitType(CreateSaleToProductDto, ['hasOrder', 'orderSupplierId'] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
