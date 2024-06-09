import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { OrderToAdditionalCost } from './order-to-addtionnal-cost.entity';

/**
 * Relationship table {reception, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class ReceptionToAdditionalCost extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({
    name: 'orderToAdditionalCost_id',
    type: 'uuid',
    nullable: false,
  })
  orderToAdditionalCostId: string;

  @ApiProperty({ required: false, type: () => OrderToAdditionalCost })
  @ManyToOne(
    () => OrderToAdditionalCost,
    (orderToAdditionalCost) => orderToAdditionalCost.receptionToAdditionalCosts,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'orderToAdditionalCost_id' })
  orderToAdditionalCost: OrderToAdditionalCost;
}
