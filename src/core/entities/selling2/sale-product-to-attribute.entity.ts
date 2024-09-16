import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { AttributeValue } from '../product/attribute-value.entity';
import { Attribute } from '../product/attribute.entity';
import { SaleToProduct } from './sale-to-product.entity';

/**
 * Relationship table {sale, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class SaleProductToAttribute extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'value_id', type: 'uuid', nullable: false })
  valueId: string;

  @ApiProperty({ required: false, type: () => AttributeValue })
  @ManyToOne(() => AttributeValue, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'value_id' })
  value: AttributeValue;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'attribute_id', type: 'uuid', nullable: false })
  attributeId: string;

  @ApiProperty({ required: false, type: () => Attribute })
  @ManyToOne(() => Attribute, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: Attribute;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'sale_to_product_id', type: 'uuid', nullable: false })
  saleToProductId: string;

  @ApiProperty({ required: false, type: () => SaleToProduct })
  @ManyToOne(
    () => SaleToProduct,
    (saleToProduct) => saleToProduct.saleProductToAttributes,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'sale_to_product_id' })
  saleToProduct: SaleToProduct;
}
