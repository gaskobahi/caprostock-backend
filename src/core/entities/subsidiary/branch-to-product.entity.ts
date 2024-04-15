import { ApiProperty } from '@nestjs/swagger';
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
import { Branch } from './branch.entity';
import { Product } from '../product/product.entity';

/**
 * Relationship table {branch, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class BranchToProduct extends CoreEntity {
  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, description: `Stock disponible` })
  @Column({
    name: 'available_stock',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  availableStock: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Est il Stock disponible` })
  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `prix de la variante du produit de ce magasin` })
  @Column({ type: 'double precision', default: 0 })
  price: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, description: `Stock disponible` })
  @Column({
    name: 'in_stock',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  inStock: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, description: `Stock faible` })
  @Column({
    name: 'low_stock',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  lowStock: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, description: `Stock Optimale` })
  @Column({
    name: 'optimal_stock',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  optimalStock: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Unité de gestion des stocks` })
  @Column({ type: 'double precision', default: 0 })
  sku: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.branchToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.branchToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
