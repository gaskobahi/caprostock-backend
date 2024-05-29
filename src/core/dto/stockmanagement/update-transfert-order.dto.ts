import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  CreateProductToTransfertOrderDto,
  CreateTransfertOrderDto,
} from './create-transfert-order.dto';
import { Type } from 'class-transformer';
import { DefaultTransferOrderTypeEnum } from 'src/core/definitions/enums';

export class UpdateTransfertOrderDto extends PartialType(
  OmitType(CreateTransfertOrderDto, [,] as const),
) {
  @IsOptional()
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
  @Type(() => UpdateProductToTransfertOrderDto)
  @ApiProperty({
    type: () => [UpdateProductToTransfertOrderDto],
    description: `Liste des produits lorsqu'il s'agit d'un order de transfert `,
  })
  productToTransfertOrders: UpdateProductToTransfertOrderDto[];
}

export class UpdateProductToTransfertOrderDto extends PartialType(
  OmitType(CreateProductToTransfertOrderDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
