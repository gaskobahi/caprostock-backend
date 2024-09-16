import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { IsNumber, IsOptional } from 'class-validator';
import { Corder } from './Corder.entity';

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

  @ApiProperty({ required: false, type: () => [Corder] })
  @OneToMany(() => Corder, (corder) => corder.customer, {
    cascade: true,
  })
  corders: Corder[];

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
