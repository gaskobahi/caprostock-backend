import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Loyalty extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Unique Name` })
  @Index()
  @Column({ name: 'unique_name' })
  uniqueName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Libellé` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Point de la fidelisation ` })
  @Column({ name: 'point_balance', type: 'double precision', default: 0.0 })
  pointBalance: number;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
