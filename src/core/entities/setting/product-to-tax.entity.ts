import { IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Tax } from './tax.entity';
import { Product } from '../product/product.entity';

@Entity()
export class ProductToTax extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.productToTaxs, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'tax_id', type: 'uuid', nullable: false })
  taxId: string;

  @ApiProperty({ required: false, type: () => Tax })
  @ManyToOne(() => Tax, (tax) => tax.productToTaxs, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'tax_id' })
  tax: Tax;
}
