import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Reason } from './reason.entity';
import { Branch } from '../subsidiary/branch.entity';
import { ProductToStockAdjustment } from './product-to-stockadjustment.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class StockAdjustment extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Column()
  reference: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Description` })
  @Index()
  @Column({ name: 'description' })
  description: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date` })
  @Column({
    name: 'stockadjustment_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsOptional()
  @IsUUID()
  @Column({ name: 'reason_id', type: 'uuid', nullable: true })
  reasonId: string;

  @ApiProperty({
    type: () => Reason,
    description: `Raison de l'ajustement de stock `,
  })
  @ManyToOne(() => Reason, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reason_id' })
  reason: Reason;

  @IsOptional()
  @IsUUID()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({
    type: () => Branch,
    description: `Surccusale liée à l'ajustement de stock`,
  })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [ProductToStockAdjustment] })
  @OneToMany(
    () => ProductToStockAdjustment,
    (productToStockAdjustment) => productToStockAdjustment.stockAdjustment,
    {
      cascade: true,
    },
  )
  productToStockAdjustments: ProductToStockAdjustment[];

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
