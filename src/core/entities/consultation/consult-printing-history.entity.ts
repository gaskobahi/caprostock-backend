import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AuthUser } from '../session/auth-user.entity';
import { Consult } from './consult.entity';

@Entity({
  orderBy: { createdAt: 'DESC' },
})
export class ConsultPrintingHistory extends BaseEntity {
  @IsUUID()
  @ApiProperty({})
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'La date de création',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @IsUUID()
  @ApiProperty()
  @Column({ name: 'consult_id', type: 'uuid' })
  consultId: string;

  @ApiProperty({ type: () => Consult })
  @ManyToOne(() => Consult, (consult) => consult.printingHistories, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'consult_id' })
  consult: Consult;

  @IsUUID()
  @ApiProperty()
  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ApiPropertyOptional({ type: () => AuthUser })
  @ManyToOne(() => AuthUser, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: AuthUser;

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
