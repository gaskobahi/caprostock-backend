import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Tax } from './tax.entity';
import { Dining } from './dining.entity';

@Entity()
export class DiningToTax extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'dining_id', type: 'uuid', nullable: false })
  diningId: string;

  @ApiProperty({ required: false, type: () => Dining })
  @ManyToOne(() => Dining, (dining) => dining.diningToTaxs, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'dining_id' })
  dining: Dining;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'tax_id', type: 'uuid', nullable: false })
  taxId: string;

  @ApiProperty({ required: false, type: () => Tax })
  @ManyToOne(() => Tax, (tax) => tax.diningToTaxs, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'tax_id' })
  tax: Tax;
}
