import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { OrderToProduct } from './order-to-product.entity';
import { Branch } from '../subsidiary/branch.entity';
import { OrderSourceEnum, OrderStatusEnum } from '../../definitions/enums';
import { Supplier } from './supplier.entity';
import { AuthUser } from '../session/auth-user.entity';
import { Expose, instanceToPlain } from 'class-transformer';
import { Sale } from '../selling/sale.entity';
import { SaleToProduct } from '../selling/sale-to-product.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Order extends CoreEntity {
  @IsNotEmpty()
  @IsIn(Object.values(OrderSourceEnum))
  @ApiProperty({
    enum: OrderSourceEnum,
    enumName: 'OrderSourceEnum',
    description: `Source`,
  })
  @Column({ name: 'order_source' })
  source: OrderSourceEnum;

  @IsNotEmpty()
  @IsIn(Object.values(OrderStatusEnum))
  @ApiProperty({
    enum: OrderStatusEnum,
    enumName: 'OrderStatusEnum',
    default: OrderStatusEnum.init,
    description: `Status`,
  })
  @Column({ name: 'order_status', default: OrderStatusEnum.init })
  status: OrderStatusEnum;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Index()
  @Column()
  reference: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Titre` })
  @Column({})
  title: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date de la commande` })
  @Column({
    name: 'order_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

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

  @ValidateIf((v: Order) => v.source === OrderSourceEnum.branch)
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'source_branch_id', type: 'uuid', nullable: true })
  sourceBranchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch: Branch;

  @ValidateIf((v: Order) => v.source === OrderSourceEnum.supplier)
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'source_supplier_id', type: 'uuid', nullable: true })
  sourceSupplierId: string;

  @ApiProperty({ required: false, type: () => Supplier })
  @ManyToOne(() => Supplier, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'source_supplier_id' })
  sourceSupplier: Supplier;

  @IsUUID()
  @IsOptional()
  @Column({ name: 'sale_to_product_id', type: 'uuid', nullable: true })
  saleToProductId: string;

  @ApiProperty({ required: false, type: () => SaleToProduct })
  @OneToOne(() => SaleToProduct, (saleToProduct) => saleToProduct.order, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'sale_to_product_id' })
  saleToProduct: SaleToProduct;

  @IsUUID()
  @IsOptional()
  @Column({ name: 'sale_id', type: 'uuid', nullable: true })
  saleId: string;

  @ApiProperty({ required: false, type: () => Sale })
  @ManyToOne(() => Sale, (sale) => sale.orders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ApiProperty({ required: false, type: () => [OrderToProduct] })
  @OneToMany(() => OrderToProduct, (orderToProduct) => orderToProduct.order, {
    cascade: true,
  })
  orderToProducts: OrderToProduct[];

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
    return Boolean(
      ~[OrderStatusEnum.validated, OrderStatusEnum.cancelled].indexOf(
        this.status,
      ),
    );
  }
  // End Getters & Setters

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
