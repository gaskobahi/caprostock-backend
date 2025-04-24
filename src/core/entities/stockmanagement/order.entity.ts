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
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { OrderToProduct } from './order-to-product.entity';
import { OrderStatusEnum } from '../../definitions/enums';
import { AuthUser } from '../session/auth-user.entity';
import { Expose, instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { Supplier } from './supplier.entity';
import { Reception } from './reception.entity';
import { OrderToAdditionalCost } from './order-to-addtionnal-cost.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Order extends CoreEntity {
  @IsNotEmpty()
  @IsIn(Object.values(OrderStatusEnum))
  @ApiProperty({
    enum: OrderStatusEnum,
    enumName: 'OrderStatusEnum',
    default: OrderStatusEnum.draft,
    description: `Status`,
  })
  @Column({ name: 'order_status', default: OrderStatusEnum.draft })
  status: OrderStatusEnum;

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
    name: 'order_date',
    type: 'datetime',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date prévu de la reception` })
  @Column({
    name: 'planned_for',
    type: 'datetime',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  plannedFor: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: `Commentaire lors la validation`,
  })
  @Column({ type: 'text', nullable: true })
  remark: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'supplier_id', type: 'uuid', nullable: false })
  supplierId: string;

  @ApiProperty({ required: false, type: () => Supplier })
  @ManyToOne(() => Supplier, (supplier) => supplier.orders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    //orphanedRowAction: 'delete',
    cascade: true,
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'destination_branch_id', type: 'uuid', nullable: false })
  destinationBranchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (destinationbranch) => destinationbranch.orders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch: Branch;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.orders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [OrderToProduct] })
  @OneToMany(() => OrderToProduct, (orderToProduct) => orderToProduct.order, {
    cascade: true,
  })
  orderToProducts: OrderToProduct[];

  @ApiProperty({ required: false, type: () => [Reception] })
  @OneToMany(() => Reception, (reception) => reception.order, {
    cascade: true,
  })
  receptions: Reception[];

  @ApiProperty({ required: false, type: () => [OrderToAdditionalCost] })
  @OneToMany(
    () => OrderToAdditionalCost,
    (orderToAdditionalCost) => orderToAdditionalCost.order,
    {
      cascade: true,
    },
  )
  orderToAdditionalCosts: OrderToAdditionalCost[];

  @ApiProperty({
    description: 'La date de validation.',
    required: false,
  })
  @Column({ name: 'validated_at', type: 'datetime', nullable: true })
  validatedAt: Date;

  @ApiPropertyOptional()
  @Column({
    name: 'validated_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  validatedById: string;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'validated_by_id' })
  validatedBy: AuthUser;

  /**
   * Getters & Setters
   */
  @Expose()
  get isClosed(): boolean {
    return Boolean(~[OrderStatusEnum.closed].indexOf(this.status));
  }
  // End Getters & Setters

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
  @BeforeInsert()
  setPlannedFor() {
    if (!this.plannedFor) {
      this.plannedFor = this.addDays(1); // Add 7 days to the current date as an example
    }
  }

  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
