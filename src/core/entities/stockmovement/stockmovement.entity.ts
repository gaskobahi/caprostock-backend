import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Product } from '../product/product.entity';
import {
  ReasonTypeEnum,
  StockMovementSourceEnum,
  StockMovementTypeEnum,
} from 'src/core/definitions/enums';
import { Branch } from '../subsidiary/branch.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class StockMovement extends CoreEntity {
  @IsNotEmpty()
  @IsUUID()
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string;

  @ApiProperty({ type: () => Product, description: `produit` })
  @ManyToOne(() => Product, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsNotEmpty()
  @IsUUID()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({ type: () => Branch, description: `branch` })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsNotEmpty()
  @IsEmpty()
  @ApiProperty({
    required: true,
    description: `produit`,
  })
  @Column({ name: 'sku', nullable: false })
  sku: number;

  @IsNotEmpty()
  @IsEmpty()
  @ApiProperty({
    required: true,
    description: `quantity`,
  })
  @Column({ name: 'quantity', nullable: false })
  quantity: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Coût` })
  @Column({ type: 'double precision', default: 0 })
  cost: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Coût` })
  @Column({ type: 'double precision', default: 0 })
  totalCost: number;

  @IsBoolean()
  @ApiProperty({ description: `isManual` })
  @Column({ type: 'boolean', default: false })
  isManual: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: `Reason` })
  @Column({ nullable: true })
  reason: ReasonTypeEnum;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Type` })
  @Column({ name: 'type' })
  type: StockMovementTypeEnum;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Source` })
  @Column({ name: 'source', nullable: false })
  source: StockMovementSourceEnum;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `SourceId` })
  @Index()
  @Column({ name: 'sourceId', nullable: false })
  sourceId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `reference` })
  @Index()
  @Column({ name: 'reference', nullable: false })
  reference: string;

  /**
   * Getters & Setters *******************************************
   */
  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
