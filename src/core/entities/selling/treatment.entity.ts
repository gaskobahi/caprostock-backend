import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { CoreEntity } from '../base/core.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Treatment extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({ description: `Nom` })
  @Column({ nullable: true, name: 'display_name' })
  displayName: string;

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
