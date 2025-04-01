import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  IsDateString,
  IsIn,
} from 'class-validator';
import { SellingStatusEnum } from 'src/core/definitions/enums';
import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Branch } from '../subsidiary/branch.entity';
import { Customer } from './customer.entity';
import { SellingToProduct } from './selling-to-product.entity';
import { SellingToAdditionalCost } from './selling-to-addtionnal-cost.entity';
import { AuthUser } from '../session/auth-user.entity';
import { Expose, instanceToPlain } from 'class-transformer';
import { CoreEntity } from '../base/core.entity';
import { Delivery } from './delivery.entity';

@Entity({ orderBy: { createdAt: 'DESC', updatedAt: 'DESC' } })
export class Selling extends CoreEntity {
  @IsNotEmpty()
  @IsIn(Object.values(SellingStatusEnum))
  @ApiProperty({
    enum: SellingStatusEnum,
    enumName: 'SellingStatusEnum',
    default: SellingStatusEnum.draft,
    description: `Status`,
  })
  @Column({ name: 'selling_status', default: SellingStatusEnum.draft })
  status: SellingStatusEnum;

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
    name: 'selling_date',
    type: 'datetime',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date prévu de la delivery` })
  @Column({
    name: 'planned_for',
    type: 'datetime',
    nullable: true,
    //default: () => '(CURRENT_DATE)',
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
  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId: string;

  @ApiProperty({ required: false, type: () => Customer })
  @ManyToOne(() => Customer, (customer) => customer.sellings, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'destination_branch_id', type: 'uuid', nullable: false })
  destinationBranchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (destinationbranch) => destinationbranch.sellings, {
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
  @ManyToOne(() => Branch, (branch) => branch.sellings, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [Delivery] })
  @OneToMany(() => Delivery, (delivery) => delivery.selling, {
    cascade: true,
  })
  deliverys: Delivery[];

  @ApiProperty({ required: false, type: () => [SellingToProduct] })
  @OneToMany(
    () => SellingToProduct,
    (sellingToProduct) => sellingToProduct.selling,
    {
      cascade: true,
    },
  )
  sellingToProducts: SellingToProduct[];

  @ApiProperty({ required: false, type: () => [SellingToAdditionalCost] })
  @OneToMany(
    () => SellingToAdditionalCost,
    (sellingToAdditionalCost) => sellingToAdditionalCost.selling,
    {
      cascade: true,
    },
  )
  sellingToAdditionalCosts: SellingToAdditionalCost[];

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
    return Boolean(~[SellingStatusEnum.closed].indexOf(this.status));
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
