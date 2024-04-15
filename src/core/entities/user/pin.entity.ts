import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { User } from './user.entity';

/**
 * Front office user
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Pin extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Code pin` })
  @Column({ name: 'code', nullable: true })
  code: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  // END Methods **************************************
}
