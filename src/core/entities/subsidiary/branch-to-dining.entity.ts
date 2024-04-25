import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Branch } from './branch.entity';
import { Dining } from '../setting/dining.entity';

/**
 * Relationship table {branch, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class BranchToDining extends CoreEntity {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Est il  disponible` })
  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Est il  disponible` })
  @Column({ name: 'is_Default', default: false })
  isDefault: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.branchToDinings, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'dining_id', type: 'uuid', nullable: false })
  diningId: string;

  @ApiProperty({ required: false, type: () => Dining })
  @ManyToOne(() => Dining, (dining) => dining.branchToDinings, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'dining_id' })
  dining: Dining;
}
