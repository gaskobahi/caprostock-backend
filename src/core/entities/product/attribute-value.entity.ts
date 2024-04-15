import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Attribute } from './attribute.entity';

@Entity({
  orderBy: { rank: 'ASC', createdAt: 'DESC', updatedAt: 'DESC' },
})
export class AttributeValue extends CoreEntity {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: `Valeur` })
  @Column({ nullable: true })
  value: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, description: 'Position' })
  @Column({ type: 'integer', default: 0 })
  rank: number;

  @IsNotEmpty()
  @IsUUID()
  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId: string;

  @ApiProperty({ type: 'object' })
  @ManyToOne(() => Attribute, (attribute) => attribute.values, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'attribute_id' })
  atttribute: Attribute;
}
