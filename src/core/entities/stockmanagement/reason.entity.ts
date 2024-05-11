import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Column, Entity, Index } from 'typeorm';
import { CoreEntity } from '../base/core.entity';

@Entity()
export class Reason extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Name` })
  @Index()
  @Column({ name: 'name' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `position` })
  @Column()
  position: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  /*@ApiProperty({ required: false, type: () => [Product] })
  @OneToMany(() => Product, (product) => product.category, {
    cascade: true,
  })
  products: Product[];*/

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
