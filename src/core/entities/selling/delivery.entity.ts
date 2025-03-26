import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { Selling } from './selling.entity';
import { DeliveryToProduct } from './delivery-to-product.entity';
import { DeliveryToAdditionalCost } from './delivery-to-addtionnal-cost.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Delivery extends CoreEntity {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Index()
  @Column()
  reference: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date de la delivery` })
  @Column({
    name: 'delivery_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.deliverys, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'selling_id', type: 'uuid', nullable: false })
  sellingId: string;

  @ApiProperty({ required: false, type: () => Selling })
  @ManyToOne(() => Selling, (selling) => selling.deliverys, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'selling_id' })
  selling: Selling;

  @ApiProperty({ required: false, type: () => [DeliveryToProduct] })
  @OneToMany(
    () => DeliveryToProduct,
    (deliveryToProduct) => deliveryToProduct.delivery,
    {
      cascade: true,
    },
  )
  deliveryToProducts: DeliveryToProduct[];

  @ApiProperty({ required: false, type: () => [DeliveryToAdditionalCost] })
  @OneToMany(
    () => DeliveryToAdditionalCost,
    (deliveryToAdditionalCost) => deliveryToAdditionalCost.delivery,
    {
      cascade: true,
    },
  )
  deliveryToAdditionalCosts: DeliveryToAdditionalCost[];

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
}
