import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { SettingTypeEnum } from 'src/core/definitions/enums';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Setting extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Name` })
  @Index()
  @Column({ name: 'name' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Libellé` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNotEmpty()
  @IsIn(Object.values(SettingTypeEnum))
  @ApiProperty({
    enum: SettingTypeEnum,
    enumName: 'SettingTypeEnum',
    description: `Type`,
  })
  @Column({ name: 'type', default: SettingTypeEnum.system })
  type: SettingTypeEnum;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `position` })
  @Column()
  position: number;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
