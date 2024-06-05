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
import { Order } from './order.entity';
import { ReceptionToProduct } from './reception-to-product.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Reception extends CoreEntity {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Index()
  @Column()
  reference: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date de la reception` })
  @Column({
    name: 'reception_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'order_id', type: 'uuid', nullable: false })
  orderId: string;

  @ApiProperty({ required: false, type: () => Order })
  @ManyToOne(() => Order, (order) => order.receptions, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.receptions, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [ReceptionToProduct] })
  @OneToMany(
    () => ReceptionToProduct,
    (receptionToProduct) => receptionToProduct.reception,
    {
      cascade: true,
    },
  )
  receptionToProducts: ReceptionToProduct[];

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
