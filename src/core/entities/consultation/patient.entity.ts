import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { Consult } from './consult.entity';
import { IsInt, IsOptional } from 'class-validator';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Patient extends PersonCoreEntity {
  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description: `Age`
  })
  @Column({ type: 'integer', nullable: true })
  age: number;

  @ApiProperty({ type: () => [Consult] })
  @OneToMany(() => Consult, (consult) => consult.patient)
  consults: Consult[];

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
