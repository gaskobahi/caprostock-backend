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
import { ProductToTransfertOrder } from './product-to-transfertorder.entity';
import { DefaultTransferOrderTypeEnum } from 'src/core/definitions/enums';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class TransfertOrder extends CoreEntity {
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

  @IsNotEmpty()
  @IsIn(Object.values(DefaultTransferOrderTypeEnum))
  @ApiProperty({
    enum: DefaultTransferOrderTypeEnum,
    enumName: 'DefaultTransferOrderTypeEnum',
    description: `Statut du transfert du stock`,
  })
  @Column({
    name: 'status',
    default: DefaultTransferOrderTypeEnum.intransit,
  })
  status: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date` })
  @Column({
    name: 'transfertorder_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsNotEmpty()
  @IsUUID()
  @Column({ name: 'source_branch_id', type: 'uuid', nullable: true })
  sourceBranchId: string;

  @ApiProperty({
    type: () => Branch,
    description: `Raison de l'ajustement de stock `,
  })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch: Branch;

  @IsNotEmpty()
  @IsUUID()
  @Column({ name: 'destination_branch_id', type: 'uuid', nullable: true })
  destinationBranchId: string;

  @ApiProperty({
    type: () => Branch,
    description: `Destination de l'ordre de transfert `,
  })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch: Branch;

  @ApiProperty({ required: false, type: () => [ProductToTransfertOrder] })
  @OneToMany(
    () => ProductToTransfertOrder,
    (productToTransfertOrder) => productToTransfertOrder.transfertOrder,
    {
      cascade: true,
    },
  )
  productToTransfertOrders: ProductToTransfertOrder[];

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
