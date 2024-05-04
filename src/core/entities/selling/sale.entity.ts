import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
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
import { SaleToProduct } from './sale-to-product.entity';
import { Branch } from '../subsidiary/branch.entity';
import { Customer } from './customer.entity';
import { InsuranceCompany } from './insurance-company.entity';
import { SalePayment } from './sale-payment.entity';
import { Order } from '../supply/order.entity';
import { AuthUser } from '../session/auth-user.entity';
import { SalePrintingHistory } from './sale-printing-history.entity';
import { Waiter } from './waiter.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Sale extends CoreEntity {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Index()
  @Column()
  reference: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date de la vente` })
  @Column({
    name: 'sale_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: `Montant effectif de la vente, directement déduit du prix des produits`,
  })
  @Column({ name: 'effective_amount', type: 'double precision', default: 0 })
  effectiveAmount: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: `Montant à payer, en tenant compte des réductions, assurance, etc.`,
  })
  @Column({ name: 'amount', type: 'double precision', default: 0 })
  amount: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Montant payé` })
  @Column({ name: 'amount_due', type: 'double precision', default: 0 })
  paidAmount: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Montant payé par l'assurance`, default: 0 })
  @Column({ name: 'insurance_amount', type: 'double precision', default: 0 })
  insuranceAmount: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: `Code donné par l'assurance` })
  @Column({ name: 'insurance_code', nullable: true })
  insuranceCode: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: `Package de lunette`, default: false })
  @Column({ name: 'is_glass_bundle', default: false, nullable: true })
  isGlassBundle: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  /*@ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.sales, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;*/

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string;

  /*@ApiProperty({ required: false, type: () => Customer })
  @ManyToOne(() => Customer, (customer) => customer.sales, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    cascade: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;*/

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'waiter_id', type: 'uuid', nullable: true })
  waiterId: string;

  @ApiProperty({ required: false, type: () => Waiter })
  @ManyToOne(() => Waiter, (waiter) => waiter.sales, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    cascade: true,
  })
  @JoinColumn({ name: 'waiter_id' })
  waiter: Waiter;

  @IsUUID()
  @IsOptional()
  @Column({ name: 'insurance_company_id', type: 'uuid', nullable: true })
  insuranceCompanyId: string;

  @ApiProperty({ required: false, type: () => InsuranceCompany })
  @ManyToOne(
    () => InsuranceCompany,
    (insuranceCompany) => insuranceCompany.sales,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'insurance_company_id' })
  insuranceCompany: InsuranceCompany;

  @IsUUID()
  @ApiPropertyOptional()
  @Column({ name: 'printing_actor_id', type: 'uuid', nullable: true })
  printingActorId: string;

  @ApiPropertyOptional({ type: () => AuthUser })
  @ManyToOne(() => AuthUser, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'printing_actor_id' })
  printingActor: AuthUser;

  @ApiPropertyOptional({ type: () => [SalePrintingHistory] })
  @OneToMany(
    () => SalePrintingHistory,
    (printingHistory) => printingHistory.sale,
    {
      cascade: true,
    },
  )
  printingHistories: SalePrintingHistory[];

  @ApiProperty({ required: false, type: () => [SaleToProduct] })
  @OneToMany(() => SaleToProduct, (saleToProduct) => saleToProduct.sale, {
    cascade: true,
  })
  saleToProducts: SaleToProduct[];

  @ApiProperty({ required: false, type: () => [SalePayment] })
  @OneToMany(() => SalePayment, (payment) => payment.sale, {
    cascade: true,
  })
  payments: SalePayment[];

  @ApiProperty({ required: false, type: () => [Order] })
  @OneToMany(() => Order, (order) => order.sale)
  orders: Order[];

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
