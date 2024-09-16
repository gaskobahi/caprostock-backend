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
import { Corder } from './Corder.entity';

/**
 * Relationship table {corder, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class CorderToProduct extends CoreEntity {
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
  @Column({ name: 'corder_id', type: 'uuid', nullable: false })
  corderId: string;

  @ApiProperty({ required: false, type: () => Corder })
  @ManyToOne(() => Corder, (corder) => corder.corderToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'corder_id' })
  corder: Corder;

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
