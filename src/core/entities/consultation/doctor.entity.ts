import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PersonCoreEntity } from '../base/person.core.entity';
import { Consult } from './consult.entity';
import { IsNotEmpty, IsString } from 'class-validator';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Doctor extends PersonCoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ required: false })
  @Index()
  @Column({ nullable: true })
  matricule: string;

  @ApiProperty({ type: () => [Consult] })
  @OneToMany(() => Consult, (consult) => consult.doctor)
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
