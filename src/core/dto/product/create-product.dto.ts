import { ApiProperty, PickType } from '@nestjs/swagger';
import { Product } from '../../entities/product/product.entity';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BranchToProduct } from '../../entities/subsidiary/branch-to-product.entity';
import { BundleToProduct } from '../../entities/product/bundle-to-product.entity';
import { AttributeToProduct } from 'src/core/entities/product/attribute-to-product.entity';
import { ProductOption } from 'src/core/entities/product/product-option.entity';
import { VariantToProduct } from 'src/core/entities/product/variant-to-product.entity';
import { BranchVariantToProduct } from 'src/core/entities/subsidiary/branch-variant-to-product.entity';
import { ProductsymbolTypeEnum } from 'src/core/definitions/enums';
import { ModifierToProduct } from 'src/core/entities/product/modifier-to-product.entity';
import { TaxToProduct } from 'src/core/entities/product/tax-to-product.entity';
import { DiscountToProduct } from 'src/core/entities/product/discount-to-product.entity';

export class CreateColorShapeDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ required: true })
  color: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ required: true })
  sharpe: string;
}

export class CreateProductDto extends PickType(Product, [
  'displayName',
  //'price',
  //'cost',
  'isActive',
  //'isBundle',
  //'hasVariant',
  //'trackStock',
  'description',
  'barreCode',
  //'sku',
  'brandId',
  //'isAvailableForSale',
  'isAvailableForOrder',
  'soldBy',
  'categoryId',
  'symbolType',
] as const) {
  @IsOptional()
  @IsString()
  reference: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @ApiProperty({
    type: () => Boolean,
    description: `boolean du produit composé`,
  })
  isBundle: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @ApiProperty({
    type: () => Boolean,
    description: `utiliser la production`,
  })
  isUseProduction: boolean;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @ApiProperty({
    type: () => Boolean,
    description: `boolean has variant produit`,
  })
  hasVariant: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @ApiProperty({
    type: () => Boolean,
    description: `boolean  suivi du stock`,
  })
  trackStock: boolean;

  @IsNotEmpty()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @ApiProperty({
    type: () => Boolean,
    description: `boolean  isAvailableForSale`,
  })
  isAvailableForSale: boolean;

  @IsNotEmpty()
  @ApiProperty({
    type: () => Number,
    description: `prix du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  price: number;

  @IsNotEmpty()
  @ApiProperty({
    type: () => Number,
    description: `lowStock du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  lowStock: number;

  @IsNotEmpty()
  @ApiProperty({
    type: () => Number,
    description: `inStock du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  inStock: number;

  @IsNotEmpty()
  @ApiProperty({
    type: () => Number,
    description: `optimalStock du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  optimalStock: number;

  @IsNotEmpty()
  @ApiProperty({
    type: () => Number,
    description: `cout du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  cost: number;

  @IsNotEmpty()
  @ApiProperty({
    type: () => Number,
    description: `SKU du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  sku: number;

  @IsNotEmpty()
  @IsObject()
  @ValidateIf(
    (p: CreateProductDto) => p.symbolType === ProductsymbolTypeEnum.colorShape,
  )
  @ApiProperty({
    type: () => CreateColorShapeDto,
    description: `la couleur et symbole du produit`,
  })
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  colorShape: CreateColorShapeDto;

  @IsNotEmpty()
  @ValidateIf(
    (p: CreateProductDto) => p.symbolType === ProductsymbolTypeEnum.image,
  )
  @ApiProperty({
    type: () => String,
    description: `l'image du produit`,
  })
  image: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateProductDto) => p.hasVariant === true)
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateProductOptionDto)
  @ApiProperty({
    type: () => [CreateProductOptionDto],
    description: `Les differents attributs de ce produits`,
  })
  options: CreateProductOptionDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateProductDto) => p.hasVariant === true)
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateVariantToProductDto)
  @ApiProperty({
    type: () => [CreateVariantToProductDto],
    description: `Les differentes  variantes de ce produit`,
  })
  variantToProducts: CreateVariantToProductDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateProductDto) => p.hasVariant === false)
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateBranchToProductDto)
  @ApiProperty({
    type: () => [CreateBranchToProductDto],
    description: `Les differentes  branches de ce produit`,
  })
  branchToProducts: CreateBranchToProductDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateIf((p: CreateProductDto) => p.isBundle === true)
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateBundleToProductDto)
  @ApiProperty({
    type: () => [CreateBundleToProductDto],
    description: `Liste des produits lorsqu'il s'agit d'un pack`,
  })
  bundleToProducts: CreateBundleToProductDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateModifierToProductDto)
  @ApiProperty({
    type: () => [CreateModifierToProductDto],
    description: `Liste des modificateurs du produit`,
  })
  modifierToProducts: CreateModifierToProductDto[];

  @IsOptional()
  //@IsArray()
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateDiscountToProductDto)
  @ApiProperty({
    type: () => [CreateDiscountToProductDto],
    description: `Liste des modificateur du produit`,
  })
  discountToProducts: CreateDiscountToProductDto[];

  @IsOptional()
  //@IsArray()
  @ValidateNested()
  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @Type(() => CreateTaxToProductDto)
  @ApiProperty({
    type: () => [CreateTaxToProductDto],
    description: `Liste des taxes du produit`,
  })
  taxToProducts: CreateTaxToProductDto[];
}

export class CreateProductOptionDto extends PickType(ProductOption, [
  'name',
] as const) {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ required: true })
  values: string[];
}

export class CreateVariantToProductDto extends PickType(VariantToProduct, [
  'name',
  'price',
  'cost',
  'sku',
] as const) {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  barreCode: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateBranchVariantToProductDto)
  @ApiProperty({
    type: () => [CreateBranchVariantToProductDto],
    description: `Les differents magasins variantes de ce produit`,
  })
  branchVariantToProducts: CreateBranchVariantToProductDto[];
}

export class CreateBranchVariantToProductDto extends PickType(
  BranchVariantToProduct,
  [
    'branchId',
    'inStock',
    'lowStock',
    'optimalStock',
    'isAvailable',
    'sku',
  ] as const,
) {
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;
}

export class CreateProductAttributeDto extends PickType(AttributeToProduct, [
  'valueId',
  'attributeId',
] as const) {}

export class CreateBranchToProductDto extends PickType(BranchToProduct, [
  'branchId',
  'inStock',
  'lowStock',
  'optimalStock',
  'isAvailable',
  'sku',
] as const) {
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;
}

export class CreateBundleToProductDto extends PickType(BundleToProduct, [
  'bundleId',
  'quantity',
  'cost',
] as const) {}

export class CreateModifierToProductDto extends PickType(ModifierToProduct, [
  'modifierId',
  'isEnable',
] as const) {}

export class CreateDiscountToProductDto extends PickType(DiscountToProduct, [
  'discountId',
  'isEnable',
] as const) {}
export class CreateTaxToProductDto extends PickType(TaxToProduct, [
  'taxId',
  'isEnable',
] as const) {}
