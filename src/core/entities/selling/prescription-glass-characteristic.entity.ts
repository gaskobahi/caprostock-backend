import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ProductPrescription } from './product-prescription.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class PrescriptionGlassCharacteristic extends CoreEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: `Titre` })
  @Column({})
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `Axe` })
  @Column({ nullable: true })
  axis: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `Add` })
  @Column({ nullable: true, name: 'characteristic_add' })
  add: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `Verre cylindrique` })
  @Column({ name: 'cylindrical_glass', nullable: true })
  cylindricalGlass: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `Verre sphérique` })
  @Column({ name: 'Spherical_glass', nullable: true })
  sphericalGlass: string;

  @IsUUID()
  @ApiProperty()
  @Column({ name: 'prescription_id', type: 'uuid' })
  prescriptionId: string;

  @ApiProperty({ required: false, type: () => ProductPrescription })
  @ManyToOne(
    () => ProductPrescription,
    (prescription) => prescription.glassCharacteristics,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'prescription_id' })
  prescription: ProductPrescription;

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
