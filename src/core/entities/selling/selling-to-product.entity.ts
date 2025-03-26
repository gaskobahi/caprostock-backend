import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Product } from '../product/product.entity';
import { Selling } from './selling.entity';

/**
 * Relationship table {selling, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class SellingToProduct extends CoreEntity {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, default: 1, description: `Quantité` })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 1,
  })
  quantity: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, description: `Sku de produit` })
  @Column({
    type: 'integer',
    unsigned: true,
  })
  sku: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Coût d'achat` })
  @Column({ type: 'double precision', default: 0 })
  cost: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'selling_id', type: 'uuid', nullable: false })
  sellingId: string;

  @ApiProperty({ required: false, type: () => Selling })
  @ManyToOne(() => Selling, (selling) => selling.sellingToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'selling_id' })
  selling: Selling;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
