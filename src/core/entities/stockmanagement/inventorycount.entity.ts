import {
  Column,
  CreateDateColumn,
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
import {
  InventoryCountStatusEnum,
  InventoryCountTypeEnum,
} from 'src/core/definitions/enums';
import { ProductToInventoryCount } from './product-to-inventoryCount.entity';
//import { ProductToInventoryCount } from './product-to-inventoryCount.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class InventoryCount extends CoreEntity {
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

  @CreateDateColumn({ name: 'stockadjustment_date', nullable: true })
  date: Date;

  @Column({
    name: 'stockadjustment_date_completed',
    type: 'date',
    nullable: true,
  })
  dateCompleted: Date;

  @IsNotEmpty()
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

  @IsNotEmpty()
  @IsIn(Object.values(InventoryCountTypeEnum))
  @ApiProperty({
    enum: InventoryCountTypeEnum,
    enumName: 'InventoryCountTypeEnum',
    description: `Type du denombrement du stock`,
  })
  @Column({
    name: 'type',
  })
  type: string;

  @IsNotEmpty()
  @IsIn(Object.values(InventoryCountStatusEnum))
  @ApiProperty({
    enum: InventoryCountStatusEnum,
    enumName: 'InventoryCountStatusEnum',
    description: `Statut du denombrement du stock`,
  })
  @Column({
    name: 'status',
    default: InventoryCountStatusEnum.pending,
  })
  status: string;

  @ApiProperty({ required: false, type: () => [ProductToInventoryCount] })
  @OneToMany(
    () => ProductToInventoryCount,
    (productToInventoryCount) => productToInventoryCount.inventoryCount,
    {
      cascade: true,
    },
  )
  productToInventoryCounts: ProductToInventoryCount[];

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
