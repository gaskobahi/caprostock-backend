import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Expose, instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { Order } from './order.entity';
import { ReceptionToProduct } from './reception-to-product.entity';
import { ReceptionToAdditionalCost } from './reception-to-addtionnal-cost.entity';
import { OrderStatusEnum } from 'src/core/definitions/enums';
import { AuthUser } from '../session/auth-user.entity';

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
  @ApiPropertyOptional({ description: `Date de la commande` })
  @Column({
    name: 'reception_date',
    type: 'datetime',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsNotEmpty()
  @IsIn(Object.values(OrderStatusEnum))
  @ApiProperty({
    enum: OrderStatusEnum,
    enumName: 'OrderStatusEnum',
    default: OrderStatusEnum.pending,
    description: `Status`,
  })
  @Column({
    name: 'reception_status',
    default: OrderStatusEnum.pending,
  })
  status: OrderStatusEnum;

  @ApiPropertyOptional()
  @Column({
    name: 'canceled_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  canceledById: string;

  @ApiPropertyOptional()
  @Column({
    name: 'closed_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  closedById: string;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'closed_by_id' })
  closedBy: AuthUser;

  @ApiProperty({
    description: 'La date de cloture ',
    required: false,
  })
  @DeleteDateColumn({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'canceled_by_id' })
  canceledBy: AuthUser;

  @ApiProperty({
    description: 'La date de cloture ',
    required: false,
  })
  @DeleteDateColumn({ name: 'canceled_at', nullable: true })
  canceledAt: Date;

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

  @ApiProperty({ required: false, type: () => [ReceptionToAdditionalCost] })
  @OneToMany(
    () => ReceptionToAdditionalCost,
    (receptionToAdditionalCost) => receptionToAdditionalCost.reception,
    {
      cascade: true,
    },
  )
  receptionToAdditionalCosts: ReceptionToAdditionalCost[];

  @Expose()
  get isClosed(): boolean {
    return Boolean(~[OrderStatusEnum.closed].indexOf(this.status));
  }

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
