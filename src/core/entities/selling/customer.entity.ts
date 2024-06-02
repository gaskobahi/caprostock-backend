import { Column, Entity } from 'typeorm';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { IsNumber, IsOptional } from 'class-validator';

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

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
