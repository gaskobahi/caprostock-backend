import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { Customer } from '../selling/customer.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Department extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsNotEmpty()
  @IsUUID()
  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @ApiProperty({ type: () => Branch, description: `Surccusale de la caisse` })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [Customer] })
  @OneToMany(() => Customer, (customer) => customer.department, {
    cascade: true,
  })
  customers: Customer[];

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
