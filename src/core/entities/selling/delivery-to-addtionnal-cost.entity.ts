import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Delivery } from './delivery.entity';
import { SellingToAdditionalCost } from './selling-to-addtionnal-cost.entity';

/**
 * Relationship table {delivery, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class DeliveryToAdditionalCost extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'delivery_id', type: 'uuid', nullable: false })
  deliveryId: string;

  @ApiProperty({ required: false, type: () => Delivery })
  @ManyToOne(() => Delivery, (delivery) => delivery.deliveryToAdditionalCosts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'delivery_id' })
  delivery: Delivery;

  @IsUUID()
  @IsNotEmpty()
  @Column({
    name: 'sellingToAdditionalCost_id',
    type: 'uuid',
    nullable: true,
  })
  sellingToAdditionalCostId: string;

  @ApiProperty({ required: false, type: () => SellingToAdditionalCost })
  @ManyToOne(
    () => SellingToAdditionalCost,
    (sellingToAdditionalCost) =>
      sellingToAdditionalCost.deliveryToAdditionalCosts,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'sellingToAdditionalCost_id' })
  sellingToAdditionalCost: SellingToAdditionalCost;
}
