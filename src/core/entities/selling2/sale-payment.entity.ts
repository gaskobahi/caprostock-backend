import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Sale } from './sale.entity';
import { SalePaymentPrintingHistory } from './sale-payment-printing-history.entity';
import { AuthUser } from '../session/auth-user.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class SalePayment extends CoreEntity {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Référence du paiement` })
  @Index()
  @Column({ nullable: true })
  reference: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date` })
  @Column({
    name: 'payment_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: `Montant`,
  })
  @Column({ name: 'amount', type: 'double precision', default: 0 })
  amount: number;

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'sale_id', type: 'uuid', nullable: false })
  saleId: string;

  @ApiProperty({ required: false, type: () => Sale })
  @ManyToOne(() => Sale, (sale) => sale.payments, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @IsUUID()
  @ApiPropertyOptional()
  @Column({ name: 'printing_actor_id', type: 'uuid', nullable: true })
  printingActorId: string;

  @ApiPropertyOptional({ type: () => AuthUser })
  @ManyToOne(() => AuthUser, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'printing_actor_id' })
  printingActor: AuthUser;

  @ApiPropertyOptional({ type: () => [SalePaymentPrintingHistory] })
  @OneToMany(
    () => SalePaymentPrintingHistory,
    (printingHistory) => printingHistory.salePayment,
    {
      cascade: true,
    },
  )
  printingHistories: SalePaymentPrintingHistory[];

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
