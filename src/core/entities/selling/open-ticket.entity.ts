import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Branch } from '../subsidiary/branch.entity';
import { OpenticketToPredefined } from './openticket-to-predefined.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class OpenTicket extends CoreEntity {
  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Predefinie` })
  @Column({ name: 'is_predefined', default: false })
  isPredefined: boolean;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.opentickets, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [OpenticketToPredefined] })
  @OneToMany(
    () => OpenticketToPredefined,
    (opentickettopredefined) => opentickettopredefined.openticket,
    {
      cascade: true,
    },
  )
  openticketToPredefined: OpenticketToPredefined[];
}
