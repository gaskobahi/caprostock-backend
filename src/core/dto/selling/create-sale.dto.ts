import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { SaleToProduct } from '../../entities/selling2/sale-to-product.entity';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Sale } from '../../entities/selling2/sale.entity';
import { CreateCustomerDto } from './create-customer.dto';
import { ProductPrescription } from '../../entities/selling2/product-prescription.entity';
import { PrescriptionGlassCharacteristic } from '../../entities/selling2/prescription-glass-characteristic.entity';
import { SaleProductToAttribute } from '../../entities/selling2/sale-product-to-attribute.entity';
import { SalePayment } from '../../entities/selling2/sale-payment.entity';
import { Treatment } from '../../entities/selling2/treatment.entity';

export class SaleCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, [] as const),
) {
  @IsNotEmpty()
  @IsUUID()
  //@ValidateIf((c: CreateCustomerDto) => !(c.lastName && c.firstName))
  @ApiPropertyOptional()
  id: string;
}

export class AddSalePaymentDto extends PartialType(
  PickType(SalePayment, ['date', 'amount', 'reference'] as const),
) {}

export class SalePaymentDto extends PartialType(
  OmitType(AddSalePaymentDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  id: string;
}

export class PrescriptionGlassCharacteristicDto extends PartialType(
  PickType(PrescriptionGlassCharacteristic, [
    'title',
    'axis',
    'add',
    'cylindricalGlass',
    'sphericalGlass',
  ] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  id: string;
}

export class SaleProductToAttributeDto extends PartialType(
  PickType(SaleProductToAttribute, ['valueId', 'attributeId'] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  id: string;
}

export class PresciptionTreatmentDto extends PartialType(
  PickType(Treatment, ['id'] as const),
) {}

export class ProductPresciptionDto extends PartialType(
  PickType(ProductPrescription, ['note'] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  id: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(2)
  @ValidateNested()
  @Type(() => PresciptionTreatmentDto)
  @ApiProperty({
    type: () => [PresciptionTreatmentDto],
    description: `Traitement`,
  })
  treatments: PresciptionTreatmentDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionGlassCharacteristicDto)
  @ApiProperty({
    type: () => [PrescriptionGlassCharacteristicDto],
    description: `Caractéristiques du verre`,
  })
  glassCharacteristics: PrescriptionGlassCharacteristicDto[];
}

export class CreateSaleDto extends PickType(Sale, [
  'date',
  'amount',
  'insuranceAmount',
  'insuranceCode',
  'isGlassBundle',
  'insuranceCompanyId',
] as const) {
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => SaleCustomerDto)
  @ApiProperty({ type: () => SaleCustomerDto })
  customer: SaleCustomerDto;

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => SalePaymentDto)
  @ApiProperty({
    type: () => [SalePaymentDto],
    description: `Lignes de paiement de la vente`,
  })
  payments: SalePaymentDto[];

  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateSaleToProductDto)
  @ApiProperty({
    type: () => [CreateSaleToProductDto],
    description: `Produits de la vente`,
  })
  saleToProducts: CreateSaleToProductDto[];
}

export class CreateSaleToProductDto extends PickType(SaleToProduct, [
  'quantity',
  'hasOrder',
  'orderSupplierId',
  'price',
  'productId',
] as const) {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductPresciptionDto)
  @ApiPropertyOptional({ type: () => ProductPresciptionDto })
  prescription: ProductPresciptionDto;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SaleProductToAttributeDto)
  @ApiProperty({
    type: () => [SaleProductToAttributeDto],
    description: `Attributs du produit associés à des valeurs`,
  })
  saleProductToAttributes: SaleProductToAttributeDto[];
}
