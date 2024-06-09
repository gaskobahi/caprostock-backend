import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Order } from './order.entity';
import { ReceptionToAdditionalCost } from './reception-to-addtionnal-cost.entity';

/**
 * Relationship table {order, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class OrderToAdditionalCost extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, default: 0, description: `Quantité` })
  @Column({
    type: 'integer',
    default: 1,
  })
  amount: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'order_id', type: 'uuid', nullable: false })
  orderId: string;

  @ApiProperty({ required: false, type: () => Order })
  @ManyToOne(() => Order, (order) => order.orderToAdditionalCosts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ApiProperty({ required: false, type: () => [ReceptionToAdditionalCost] })
  @OneToMany(
    () => ReceptionToAdditionalCost,
    (receptionToAdditionalCost) =>
      receptionToAdditionalCost.orderToAdditionalCost,
    {
      cascade: true,
    },
  )
  receptionToAdditionalCosts: ReceptionToAdditionalCost[];
}
