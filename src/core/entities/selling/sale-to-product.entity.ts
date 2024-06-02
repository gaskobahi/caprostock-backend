import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Sale } from './sale.entity';
import { Product } from '../product/product.entity';
import { ProductPrescription } from './product-prescription.entity';
import { SaleProductToAttribute } from './sale-product-to-attribute.entity';
import { Order } from '../stockmanagement/order.entity';
import { Supplier } from '../stockmanagement/supplier.entity';

/**
 * Relationship table {sale, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class SaleToProduct extends CoreEntity {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({ required: true, default: 1, description: `Quantité` })
  @Column({
    type: 'integer',
    unsigned: true,
    default: 1,
  })
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: `Montant`, default: 0 })
  @Column({ type: 'double precision', default: 0 })
  price: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Ce produit génére une commande ?`,
  })
  @Column({
    default: false,
  })
  hasOrder: boolean;

  @ValidateIf((v: SaleToProduct) => v.hasOrder === true)
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'order_supplier_id', type: 'uuid', nullable: true })
  orderSupplierId: string;

  @ApiProperty({ required: false, type: () => Supplier })
  @ManyToOne(() => Supplier, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'order_supplier_id' })
  orderSupplier: Supplier;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'sale_id', type: 'uuid', nullable: false })
  saleId: string;

  @ApiProperty({ required: false, type: () => Sale })
  @ManyToOne(() => Sale, (sale) => sale.saleToProducts, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ required: false, type: () => ProductPrescription })
  @OneToOne(
    () => ProductPrescription,
    (prescription) => prescription.saleToProduct,
    {
      cascade: true,
    },
  )
  prescription: ProductPrescription;

  /*@ApiProperty({ required: false, type: () => Order })
  @OneToOne(() => Order, (order) => order.saleToProduct)
  order: Order;*/

  @ApiProperty({ required: false, type: () => [SaleProductToAttribute] })
  @OneToMany(
    () => SaleProductToAttribute,
    (saleProductToAttribute) => saleProductToAttribute.saleToProduct,
    {
      cascade: true,
    },
  )
  saleProductToAttributes: SaleProductToAttribute[];
}
