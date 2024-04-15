import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sale } from './sale.entity';
import { CoreEntity } from '../base/core.entity';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class InsuranceCompany extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ type: () => [Sale] })
  @OneToMany(() => Sale, (sale) => sale.insuranceCompany)
  sales: Sale[];

  /**
   * Getters & Setters *******************************************
   */

  // END Getters & Setters *******************************************

  /**
   * Methods *******************************************
   */
  // END Methods **************************************
}
