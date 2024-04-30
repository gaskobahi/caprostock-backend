import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Product } from './product.entity';

@Entity()
export class Category extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Couleur` })
  @Column({ name: 'color' })
  color: string;

  @ApiProperty({ required: false, type: () => [Product] })
  @OneToMany(() => Product, (product) => product.category, {
    cascade: true,
  })
  products: Product[];

  /**
   * Getters & Setters
   */

  // End Getters & Setters

  /**
   * Methods *******************************************
   */

  // END Methods **************************************
}
