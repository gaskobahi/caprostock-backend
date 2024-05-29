import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransfertOrder } from 'src/core/entities/stockmanagement/transfertorder.entity';
import { ProductToTransfertOrder } from 'src/core/entities/stockmanagement/product-to-transfertorder.entity';
import { DefaultTransferOrderTypeEnum } from 'src/core/definitions/enums';

export class CreateTransfertOrderDto extends PickType(TransfertOrder, [
  'sourceBranchId',
  'destinationBranchId',
] as const) {
  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ required: true })
  action: DefaultTransferOrderTypeEnum;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: true })
  status: DefaultTransferOrderTypeEnum;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateProductToTransfertOrderDto)
  @ApiProperty({
    type: () => [CreateProductToTransfertOrderDto],
    description: `Les differents produit de cet ordre de transfert`,
  })
  productToTransfertOrders: CreateProductToTransfertOrderDto[];
}

export class CreateProductToTransfertOrderDto extends PickType(
  ProductToTransfertOrder,
  ['productId', 'quantity', 'sku'] as const,
) {
  @IsOptional()
  @IsBoolean()
  hasVariant: boolean;
  @IsOptional()
  @IsString()
  variantId: string;
  @IsOptional()
  @IsNumber()
  srcInStock: number;
  @IsOptional()
  @IsNumber()
  dstInStock: number;
}
