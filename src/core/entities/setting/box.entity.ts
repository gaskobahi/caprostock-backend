import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Box extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Pack de produits`,
  })
  @Column({ name: 'is_enable', default: false })
  isEnable: boolean;

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

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
