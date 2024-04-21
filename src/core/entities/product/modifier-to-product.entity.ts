import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { Modifier } from './modifier.entity';

@Entity()
export class ModifierToProduct extends CoreEntity {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Activé pour le produit` })
  @Column({ name: 'isEnable', default: false })
  isEnable: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'modifier_id', type: 'uuid', nullable: false })
  modifierId: string;

  @ApiProperty({ required: false, type: () => Modifier })
  @ManyToOne(() => Modifier, (modifier) => modifier.modifierToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'modifier_id' })
  modifier: Modifier;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.modifierToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
