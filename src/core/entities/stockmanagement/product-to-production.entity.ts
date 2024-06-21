import { IsInt, IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product/product.entity';
import { Production } from './production.entity';

@Entity()
export class ProductToProduction extends CoreEntity {
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

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.productToProductions, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'production_id', type: 'uuid', nullable: false })
  productionId: string;

  @ApiProperty({ required: false, type: () => Production })
  @ManyToOne(
    () => Production,
    (production) => production.productToProductions,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'production_id' })
  production: Production;
}
