import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { IsNumber, IsOptional } from 'class-validator';
import { Selling } from './selling.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Customer extends PersonCoreEntity {
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Column({ nullable: true })
  code: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: `Point du client ` })
  @Column({ type: 'double precision', default: 0 })
  pointBalance: number;

  @ApiProperty({ required: false, type: () => [Selling] })
  @OneToMany(() => Selling, (selling) => selling.customer, { cascade: true })
  sellings: Selling[];
  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
