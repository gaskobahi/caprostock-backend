import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { Tax } from '../setting/tax.entity';

@Entity()
export class TaxToProduct extends CoreEntity {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Activé pour le produit` })
  @Column({ name: 'isEnable', default: false })
  isEnable: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'tax_id', type: 'uuid', nullable: false })
  taxId: string;

  @ApiProperty({ required: false, type: () => Tax })
  @ManyToOne(() => Tax, (tax) => tax.taxToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'tax_id' })
  tax: Tax;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.taxToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
