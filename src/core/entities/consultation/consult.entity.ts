import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ConsultStatusEnum } from '../../definitions/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { instanceToPlain } from 'class-transformer';
import { CoreEntity } from '../base/core.entity';
import { Branch } from '../subsidiary/branch.entity';
import { ConsultType } from './consult-type.entity';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';
import { AuthUser } from '../session/auth-user.entity';
import { ConsultPrintingHistory } from './consult-printing-history.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Consult extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Index({ unique: true })
  @Column()
  reference: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date de la consultation` })
  @Column({
    name: 'consult_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: `Identifiant dans le système externe`,
  })
  @Column({ name: 'external_id', nullable: true })
  externalId: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Montant` })
  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @IsBoolean()
  @ApiProperty({ description: `Acheter chez nous` })
  @Column({ name: 'in_store_purchase' })
  inStorePurchase: boolean;

  @IsNotEmpty()
  @IsIn(Object.values(ConsultStatusEnum))
  @ApiProperty({
    description: `Status`,
    enum: ConsultStatusEnum,
    enumName: 'ConsultStatusEnum',
  })
  @Column({ default: ConsultStatusEnum.init })
  status: ConsultStatusEnum;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsUUID()
  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ApiProperty({ type: () => Branch })
  @ManyToOne(() => Branch, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @IsUUID()
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @ApiProperty({ type: () => Patient })
  @ManyToOne(() => Patient, (patient) => patient.consults, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @IsUUID()
  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId: string;

  @ApiProperty({ type: () => Doctor })
  @ManyToOne(() => Doctor, (doctor) => doctor.consults, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @IsUUID()
  @ApiProperty()
  @Column({ name: 'consult_type_id', type: 'uuid' })
  consultTypeId: string;

  @ApiProperty({ type: () => ConsultType })
  @ManyToOne(() => ConsultType, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'consult_type_id' })
  consultType: ConsultType;

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

  @ApiPropertyOptional({ type: () => [ConsultPrintingHistory] })
  @OneToMany(
    () => ConsultPrintingHistory,
    (printingHistory) => printingHistory.consult,
    {
      cascade: true,
    },
  )
  printingHistories: ConsultPrintingHistory[];

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
