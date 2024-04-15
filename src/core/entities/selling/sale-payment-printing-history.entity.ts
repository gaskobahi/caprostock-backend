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
import { SalePayment } from './sale-payment.entity';

@Entity({
  orderBy: { createdAt: 'DESC' },
})
export class SalePaymentPrintingHistory extends BaseEntity {
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
  @Column({ name: 'salePayment_id', type: 'uuid' })
  salePaymentId: string;

  @ApiProperty({ type: () => SalePayment })
  @ManyToOne(
    () => SalePayment,
    (salePayment) => salePayment.printingHistories,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'salePayment_id' })
  salePayment: SalePayment;

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
