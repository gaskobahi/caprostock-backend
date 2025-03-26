import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
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
import { CorderStatusEnum } from '../../definitions/enums';
import { AuthUser } from '../session/auth-user.entity';
import { Expose, instanceToPlain } from 'class-transformer';
import { Branch } from '../subsidiary/branch.entity';
import { CorderToProduct } from './corder-to-product.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Corder extends CoreEntity {
  @IsNotEmpty()
  @IsIn(Object.values(CorderStatusEnum))
  @ApiProperty({
    enum: CorderStatusEnum,
    enumName: 'CorderStatusEnum',
    default: CorderStatusEnum.draft,
    description: `Status`,
  })
  @Column({ name: 'corder_status', default: CorderStatusEnum.draft })
  status: CorderStatusEnum;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Référence` })
  @Index()
  @Column()
  reference: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date de la commande` })
  @Column({
    name: 'corder_date',
    type: 'date',
    nullable: true,
    default: () => '(CURRENT_DATE)',
  })
  date: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: `Commentaire lors la validation`,
  })
  @Column({ type: 'text', nullable: true })
  remark: string;

  /* @IsUUID()
  @IsOptional()
  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId: string;

  @ApiProperty({ required: false, type: () => Customer })
  @ManyToOne(() => Customer, (customer) => customer.corders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;*/

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.corders, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ApiProperty({ required: false, type: () => [CorderToProduct] })
  @OneToMany(
    () => CorderToProduct,
    (corderToProduct) => corderToProduct.corder,
    {
      cascade: true,
    },
  )
  corderToProducts: CorderToProduct[];

  @ApiProperty({
    description: 'La date de validation.',
    required: false,
  })
  @Column({ name: 'validated_at', type: 'datetime', nullable: true })
  validatedAt: Date;

  @ApiPropertyOptional()
  @Column({
    name: 'validated_by_id',
    nullable: true,
    type: 'uuid',
  })
  @IsOptional()
  validatedById: string;

  @ApiPropertyOptional({ type: 'object' })
  @ManyToOne(() => AuthUser, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'validated_by_id' })
  validatedBy: AuthUser;

  /**
   * Getters & Setters
   */
  @Expose()
  get isClosed(): boolean {
    return Boolean(~[CorderStatusEnum.closed].indexOf(this.status));
  }
  // End Getters & Setters

  /**
   * Methods *******************************************
   */
  toJSON() {
    return instanceToPlain(this);
  }

  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
