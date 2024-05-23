import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { BranchToProduct } from '../subsidiary/branch-to-product.entity';
import {
  ProductSoldByEnum,
  ProductsymbolTypeEnum,
} from '../../definitions/enums';
import { instanceToPlain } from 'class-transformer';
import { Brand } from './brand.entity';
import { BundleToProduct } from './bundle-to-product.entity';
import { Category } from './category.entity';
import { ProductOption } from './product-option.entity';
import { VariantToProduct } from './variant-to-product.entity';
import { ModifierToProduct } from './modifier-to-product.entity';
import { TaxToProduct } from './tax-to-product.entity';
import { DiscountToProduct } from './discount-to-product.entity';
import { ProductToTax } from '../setting/product-to-tax.entity';
import { ProductToStockAdjustment } from '../stockmanagement/product-to-stockadjustment.entity';
import { ProductToInventoryCount } from '../stockmanagement/product-to-inventoryCount.entity';
import { HistoryToInventoryCount } from '../stockmanagement/history-to-inventorycount.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Product extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Column()
  reference: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Pack de produits`,
  })
  @Column({ name: 'is_bundle', default: false })
  isBundle: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Pack de produits`,
  })
  @Column({ name: 'has_variant', default: false })
  hasVariant: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Suivre le stock de ce produit`,
  })
  @Column({ name: 'track_stock', default: false })
  trackStock: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: `Montant du produit` })
  @Column({ type: 'double precision', default: 0 })
  price: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Unité de gestion des stocks` })
  @Column({ type: 'double precision', default: 0 })
  sku: number;

  @IsOptional()
  @ApiProperty({ description: `Code barres` })
  @Column({ name: 'code_barres', nullable: true })
  barreCode: string;

  @IsNotEmpty()
  @IsIn(Object.values(ProductSoldByEnum))
  @ApiProperty({
    enum: ProductSoldByEnum,
    enumName: 'ProductSoldByEnum',
    description: `Sold By`,
  })
  @Column({ name: 'soldBy', default: ProductSoldByEnum.each })
  soldBy: ProductSoldByEnum;
  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Cout du produit ` })
  @Column({ type: 'double precision', default: 0 })
  cost: number;

  @IsNotEmpty()
  @IsIn(Object.values(ProductsymbolTypeEnum))
  @ApiProperty({
    enum: ProductsymbolTypeEnum,
    enumName: 'ProductsymbolTypeEnum',
    description: `Representation du produit`,
  })
  @Column({
    name: 'symbol_Type' /*default: ProductsymbolTypeEnum.colorShape */,
  })
  symbolType: ProductsymbolTypeEnum;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'simple-json', nullable: true })
  colorShape: any;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  image: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Disponible pour la vente` })
  @Column({ name: 'isAvailableForSale', default: true })
  isAvailableForSale: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Disponible pour la commande` })
  @Column({ name: 'isAvailableForOrder', default: true })
  isAvailableForOrder: boolean;

  @IsOptional()
  @IsUUID()
  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId: string;

  @ApiProperty({ type: () => Brand, description: `Marque du produit` })
  @ManyToOne(() => Brand, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @IsOptional()
  @IsUUID()
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @ApiProperty({ type: () => Category, description: `Catégorie du produit` })
  @ManyToOne(() => Category, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ApiProperty({ required: false, type: () => [ProductOption] })
  @OneToMany(() => ProductOption, (option) => option.product, {
    cascade: true,
  })
  options: ProductOption[];

  @ApiProperty({ required: false, type: () => [BranchToProduct] })
  @OneToMany(
    () => BranchToProduct,
    (branchToProduct) => branchToProduct.product,
    {
      cascade: true,
    },
  )
  branchToProducts: BranchToProduct[];

  @ApiProperty({ required: false, type: () => [BundleToProduct] })
  @OneToMany(
    () => BundleToProduct,
    (bundleToProduct) => bundleToProduct.product,
    {
      cascade: true,
    },
  )
  bundleToProducts: BundleToProduct[];

  @ApiProperty({ required: false, type: () => [VariantToProduct] })
  @OneToMany(
    () => VariantToProduct,
    (variantToProduct) => variantToProduct.product,
    {
      cascade: true,
    },
  )
  variantToProducts: VariantToProduct[];

  @ApiProperty({ required: false, type: () => [ModifierToProduct] })
  @OneToMany(
    () => ModifierToProduct,
    (modifierToProduct) => modifierToProduct.product,
    {
      cascade: true,
    },
  )
  modifierToProducts: ModifierToProduct[];

  @ApiProperty({ required: false, type: () => [DiscountToProduct] })
  @OneToMany(
    () => DiscountToProduct,
    (discountToProduct) => discountToProduct.product,
    {
      cascade: true,
    },
  )
  discountToProducts: DiscountToProduct[];

  @ApiProperty({ required: false, type: () => [TaxToProduct] })
  @OneToMany(() => TaxToProduct, (taxToProduct) => taxToProduct.product, {
    cascade: true,
  })
  taxToProducts: ProductToTax[];

  @ApiProperty({ required: false, type: () => [ProductToTax] })
  @OneToMany(() => ProductToTax, (taxToProduct) => taxToProduct.product, {
    cascade: true,
  })
  productToTaxs: ProductToTax[];

  @ApiProperty({ required: false, type: () => [ProductToStockAdjustment] })
  @OneToMany(
    () => ProductToStockAdjustment,
    (productToStockAdjustment) => productToStockAdjustment.product,
    {
      cascade: true,
    },
  )
  productToStockAdjustments: ProductToStockAdjustment[];

  @ApiProperty({ required: false, type: () => [ProductToInventoryCount] })
  @OneToMany(
    () => ProductToInventoryCount,
    (productToInventoryCount) => productToInventoryCount.product,
    {
      cascade: true,
    },
  )
  productToInventoryCounts: ProductToInventoryCount[];

  @ApiProperty({ required: false, type: () => [HistoryToInventoryCount] })
  @OneToMany(
    () => HistoryToInventoryCount,
    (historyToInventoryCount) => historyToInventoryCount.product,
    {
      cascade: true,
    },
  )
  historyToInventoryCounts: HistoryToInventoryCount[];

  /**
   * Getters & Setters *******************************************
   */
  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
