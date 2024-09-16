import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
//import { Order } from '../supply/order.entity';
import { Corder } from './Corder.entity';
import { Branch } from '../subsidiary/branch.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Ticket extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Predefinie` })
  @Column({ name: 'is_predefined', default: false })
  isPredefined: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Statut` })
  @Column({ name: 'status', default: false })
  status: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.corders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [Corder] })
  @OneToMany(() => Corder, (corder) => corder.ticket, {
    cascade: true,
  })
  corders: Corder[];
}
