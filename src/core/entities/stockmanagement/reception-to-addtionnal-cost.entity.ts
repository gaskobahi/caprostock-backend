import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { OrderToAdditionalCost } from './order-to-addtionnal-cost.entity';
import { Reception } from './reception.entity';

/**
 * Relationship table {reception, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class ReceptionToAdditionalCost extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'reception_id', type: 'uuid', nullable: false })
  receptionId: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Coût additionnel recu` })
  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @ApiProperty({ required: false, type: () => Reception })
  @ManyToOne(
    () => Reception,
    (reception) => reception.receptionToAdditionalCosts,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'reception_id' })
  reception: Reception;

  @IsUUID()
  @IsNotEmpty()
  @Column({
    name: 'orderToAdditionalCost_id',
    type: 'uuid',
    nullable: true,
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
