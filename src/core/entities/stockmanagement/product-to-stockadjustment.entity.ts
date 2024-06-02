import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product/product.entity';
import { StockAdjustment } from './stockadjustment.entity';

@Entity()
export class ProductToStockAdjustment extends CoreEntity {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    required: true,
    default: 0,
    description: `Quantité à ajouter au stock`,
  })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  quantity: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, default: 0, description: `Cout de produit` })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  cost: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, description: `Sku de produit` })
  @Column({
    type: 'integer',
    unsigned: true,
  })
  sku: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, default: 1, description: `Quantité en stock` })
  @Column({
    name: 'in_stock',
    type: 'integer',
    default: 0,
  })
  inStock: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    required: true,
    default: 1,
    description: `Quantité en stock apres ajout`,
  })
  @Column({
    name: 'after_quantity',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  afterQuantity: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.productToStockAdjustments, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'stock_adjustment_id', type: 'uuid', nullable: false })
  stockAdjustmentId: string;

  @ApiProperty({ required: false, type: () => StockAdjustment })
  @ManyToOne(
    () => StockAdjustment,
    (stockadjustment) => stockadjustment.productToStockAdjustments,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'stock_adjustment_id' })
  stockAdjustment: StockAdjustment;
}
