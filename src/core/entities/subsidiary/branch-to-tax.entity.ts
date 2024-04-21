import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Branch } from './branch.entity';
import { Tax } from '../setting/tax.entity';

/**
 * Relationship table {branch, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class BranchToTax extends CoreEntity {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Est il  disponible` })
  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.branchToTaxs, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'tax_id', type: 'uuid', nullable: false })
  taxId: string;

  @ApiProperty({ required: false, type: () => Tax })
  @ManyToOne(() => Tax, (tax) => tax.branchToTaxs, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'tax_id' })
  tax: Tax;
}
