import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Selling } from './selling.entity';
import { DeliveryToAdditionalCost } from './delivery-to-addtionnal-cost.entity';

/**
 * Relationship table {selling, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class SellingToAdditionalCost extends CoreEntity {
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
  @Column({ name: 'selling_id', type: 'uuid', nullable: false })
  sellingId: string;

  @ApiProperty({ required: false, type: () => Selling })
  @ManyToOne(() => Selling, (selling) => selling.sellingToAdditionalCosts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'selling_id' })
  selling: Selling;

  @ApiProperty({ required: false, type: () => [DeliveryToAdditionalCost] })
  @OneToMany(
    () => DeliveryToAdditionalCost,
    (deliveryToAdditionalCost) =>
      deliveryToAdditionalCost.sellingToAdditionalCost,
    {
      cascade: true,
    },
  )
  deliveryToAdditionalCosts: DeliveryToAdditionalCost[];
}
