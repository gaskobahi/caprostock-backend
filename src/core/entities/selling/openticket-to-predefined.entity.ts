import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { OpenTicket } from './open-ticket.entity';

/**
 * Relationship table {branch, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class OpenticketToPredefined extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name', nullable: false })
  displayName: string;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'openticket_id', type: 'uuid', nullable: false })
  openticketId: string;

  @ApiProperty({ required: false, type: () => OpenTicket })
  @ManyToOne(
    () => OpenTicket,
    (openticket) => openticket.openticketToPredefined,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      orphanedRowAction: 'delete',
    },
  )
  @JoinColumn({ name: 'openticket_id' })
  openticket: OpenTicket;
}
