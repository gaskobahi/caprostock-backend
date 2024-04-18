import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Modifier } from './modifier.entity';

@Entity()
export class OptionToModifier extends CoreEntity {
  @IsString()
  @IsNotEmpty()
  @Column({ name: 'name', nullable: false })
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ required: true, default: 0, description: `Prix` })
  @Column({ type: 'integer', unsigned: true, default: 0 })
  price: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'modifier_id', type: 'uuid', nullable: false })
  modifierId: string;

  @ApiProperty({ required: false, type: () => Modifier })
  @ManyToOne(() => Modifier, (modifier) => modifier.optionToModifiers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'modifier_id' })
  modifier: Modifier;
}
