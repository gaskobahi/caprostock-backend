import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { ProductionToProduct } from './production-to-product.entity';
import { ProductionStatusEnum } from 'src/core/definitions/enums';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Production extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Column()
  reference: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Description` })
  @Index()
  @Column({ name: 'description' })
  description: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date` })
  @Column({
    name: 'production_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'destination_branch_id', type: 'uuid', nullable: false })
  destinationBranchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(
    () => Branch,
    (destinationbranch) => destinationbranch.productions,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch: Branch;

  @IsNotEmpty()
  @IsIn(Object.values(ProductionStatusEnum))
  @ApiProperty({
    enum: ProductionStatusEnum,
    enumName: 'ProductionStatusEnum',
    description: `Type de production`,
  })
  @Column({
    name: 'type',
  })
  type: string;
  @IsOptional()
  @IsUUID()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({
    type: () => Branch,
    description: `Surccusale liée à l'ajustement de stock`,
  })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [ProductionToProduct] })
  @OneToMany(
    () => ProductionToProduct,
    (productionToProduct) => productionToProduct.production,
    {
      cascade: true,
    },
  )
  productionToProducts: ProductionToProduct[];

  /**
   * Getters & Setters *******************************************
   */
  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
