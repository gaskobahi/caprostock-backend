import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Feature extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'pseudoName' })
  pseudoName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `Statut de la fonctionalité`,
  })
  @Column({ name: 'isEnable', default: false })
  isEnable: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
