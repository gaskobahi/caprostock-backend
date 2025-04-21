import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
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
import { instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { Selling } from './selling.entity';
import { DeliveryToProduct } from './delivery-to-product.entity';
import { DeliveryToAdditionalCost } from './delivery-to-addtionnal-cost.entity';
import { Customer } from './customer.entity';
import { SellingStatusEnum } from 'src/core/definitions/enums';
import { AuthUser } from '../session/auth-user.entity';

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
    type: 'datetime',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsNotEmpty()
  @IsIn(Object.values(SellingStatusEnum))
  @ApiProperty({
    enum: SellingStatusEnum,
    enumName: 'SellingStatusEnum',
    default: SellingStatusEnum.pending,
    description: `Status`,
  })
  @Column({
    name: 'reception_status',
    default: SellingStatusEnum.pending,
  })
  status: SellingStatusEnum;

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

  @ApiProperty({
    description: 'for generate delivery',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Column({
    name: 'selling_id',
    type: 'uuid',
    nullable: true,
  })
  sellingId: string;

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

  @ApiProperty({ required: false, type: () => Selling })
  @ManyToOne(() => Selling, (selling) => selling.deliverys, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'selling_id' })
  selling: Selling;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'transporter_id', type: 'uuid', nullable: false })
  transporterId: string;

  @ApiProperty({ required: false, type: () => Customer })
  @ManyToOne(() => Customer, (transporter) => transporter.deliverys, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    //orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'transporter_id' })
  transporter: Customer;

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
