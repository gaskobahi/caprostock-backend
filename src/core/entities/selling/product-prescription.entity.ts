import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Sale } from './sale.entity';
import { PrescriptionGlassCharacteristic } from './prescription-glass-characteristic.entity';
import { SaleToProduct } from './sale-to-product.entity';
import { Treatment } from './treatment.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class ProductPrescription extends CoreEntity {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `Note` })
  @Column({ nullable: true })
  note: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'sale_to_product_id', type: 'uuid', nullable: false })
  saleToProductId: string;

  @ApiProperty({ required: false, type: () => Sale })
  @OneToOne(
    () => SaleToProduct,
    (saleToProduct) => saleToProduct.prescription,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'sale_to_product_id' })
  saleToProduct: SaleToProduct;

  @ApiProperty({
    required: false,
    description: `Traitements`,
    type: () => [Treatment],
  })
  @ManyToMany(() => Treatment, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'product_prescription_treatments',
    joinColumn: {
      name: 'prescription_id',
    },
    inverseJoinColumn: {
      name: 'treatment_id',
    },
  })
  treatments: Treatment[];

  @ApiProperty({
    required: false,
    type: () => [PrescriptionGlassCharacteristic],
  })
  @OneToMany(
    () => PrescriptionGlassCharacteristic,
    (glassCharacteristic) => glassCharacteristic.prescription,
    {
      cascade: true,
    },
  )
  glassCharacteristics: PrescriptionGlassCharacteristic[];

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
