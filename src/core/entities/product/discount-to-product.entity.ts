import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { Discount } from './discount.entity';

@Entity()
export class DiscountToProduct extends CoreEntity {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Activé pour le produit` })
  @Column({ name: 'isEnable', default: false })
  isEnable: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'discount_id', type: 'uuid', nullable: false })
  discountId: string;

  @ApiProperty({ required: false, type: () => Discount })
  @ManyToOne(() => Discount, (discount) => discount.discountToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.discountToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
