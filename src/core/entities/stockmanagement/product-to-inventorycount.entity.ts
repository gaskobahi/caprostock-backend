import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product/product.entity';
import { InventoryCount } from './inventorycount.entity';

@Entity()
export class ProductToInventoryCount extends CoreEntity {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    required: true,
    default: 0,
    description: `quantité physique countée`,
  })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  counted: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Appartient deja à la liste` })
  @Column({ name: 'is_belong', default: false })
  isBelong: boolean;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    required: true,
    default: 0,
    description: `Difference du coût de produit après inventaire`,
  })
  @Column({
    name: 'difference_cost',
    type: 'integer',
    //unsigned: true,
    default: 0,
  })
  differenceCost: number;

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
  @IsNumber()
  @ApiProperty({
    required: true,
    default: 0,
    description: `Quantité en stock apres ajout`,
  })
  @Column({
    name: 'difference',
    type: 'integer',
    //unsigned: true,
    default: 0,
  })
  difference: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.productToInventoryCounts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'inventory_count_id', type: 'uuid', nullable: false })
  inventoryCountId: string;

  @ApiProperty({ required: false, type: () => InventoryCount })
  @ManyToOne(
    () => InventoryCount,
    (inventorycount) => inventorycount.productToInventoryCounts,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'inventory_count_id' })
  inventoryCount: InventoryCount;
  //displayName: string;
}
