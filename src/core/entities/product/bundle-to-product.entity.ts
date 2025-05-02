import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity()
export class BundleToProduct extends CoreEntity {
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
  @ApiProperty({ required: true, default: 1, description: `Cout de composant` })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 0,
  })
  cost: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Pack de produits`,
  })
  @Column({ name: 'is_bundle', default: false })
  isBundle: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Variant de produits`,
  })
  @Column({ name: 'is_variant', default: false })
  isVariant: boolean;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `sku` })
  @Column({ type: 'double precision', default: 0 })
  sku: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'bundle_id', type: 'uuid', nullable: false })
  bundleId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (bundle) => bundle.bundleToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'bundle_id' })
  bundle: Product;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.bundleToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
