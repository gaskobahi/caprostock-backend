import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { BranchVariantToProduct } from '../subsidiary/branch-variant-to-product.entity';

@Entity()
export class VariantToProduct extends CoreEntity {
  @IsString()
  @IsNotEmpty()
  @Column({ name: 'name', nullable: false })
  name: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Prix de vente de la variante de produit` })
  @Column({ type: 'double precision', default: 0 })
  price: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Coût d'achat de la variante de produit` })
  @Column({ type: 'double precision', default: 0 })
  cost: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Unité de gestion des stocks` })
  @Column({ type: 'double precision', default: 0 })
  sku: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Code barres` })
  @Column({ name: 'code_barres', nullable: true })
  barreCode: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.variantToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ required: false, type: () => [BranchVariantToProduct] })
  @OneToMany(
    () => BranchVariantToProduct,
    (branchVariantToProduct) => branchVariantToProduct.variantToproduct,
    {
      cascade: true,
    },
  )
  branchVariantToProducts: BranchVariantToProduct[];
  inStock: any;
}
