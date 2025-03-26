import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Product } from '../product/product.entity';
import { Delivery } from './delivery.entity';

/**
 * Relationship table {order, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class DeliveryToProduct extends CoreEntity {
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

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'delivery_id', type: 'uuid', nullable: false })
  deliveryId: string;

  @ApiProperty({ required: false, type: () => Delivery })
  @ManyToOne(() => Delivery, (delivery) => delivery.deliveryToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'delivery_id' })
  delivery: Delivery;

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
