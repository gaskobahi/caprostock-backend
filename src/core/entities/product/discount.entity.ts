import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { DiscountTypeEnum } from 'src/core/definitions/enums';

@Entity()
export class Discount extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNotEmpty()
  @IsIn(Object.values(DiscountTypeEnum))
  @ApiProperty({
    enum: DiscountTypeEnum,
    enumName: 'DiscountTypeEnum',
    description: `Type`,
  })
  @Column({ name: 'type', default: DiscountTypeEnum.percentage })
  type: DiscountTypeEnum;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Valeur de la reduction ` })
  @Column({ type: 'double precision', default: 0 })
  value: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Restriction au POS` })
  @Column({ name: 'pos_access', default: false })
  posaccess: boolean;

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
