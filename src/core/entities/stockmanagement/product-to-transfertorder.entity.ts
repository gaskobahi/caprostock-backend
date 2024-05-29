import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product/product.entity';
import { TransfertOrder } from './transfertorder.entity';

@Entity()
export class ProductToTransfertOrder extends CoreEntity {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    required: true,
    default: 0,
    description: `Quantité à transferer au stock`,
  })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 0,
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

  /*@IsNotEmpty()
  @IsInt()
  @ApiProperty({
    required: true,
    default: 1,
    description: `Quantité source en stock`,
  })
  @Column({
    name: 'src_in_stock',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  srcInStock: number;*/

  /*@IsNotEmpty()
  @IsInt()
  @ApiProperty({
    required: true,
    default: 1,
    description: `Quantité destination en stock`,
  })
  @Column({
    name: 'dst_in_stock',
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  dstInStock: number;*/

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.productToTransfertOrders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'transfert_order_id', type: 'uuid', nullable: false })
  transfertOrderId: string;

  @ApiProperty({ required: false, type: () => TransfertOrder })
  @ManyToOne(
    () => TransfertOrder,
    (transfertorder) => transfertorder.productToTransfertOrders,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'transfert_order_id' })
  transfertOrder: TransfertOrder;
}
