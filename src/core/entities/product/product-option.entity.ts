import { IsArray, IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity()
export class ProductOption extends CoreEntity {
  @IsString()
  @IsNotEmpty()
  @Column({ name: 'name', nullable: false })
  name: string;
  @IsArray()
  @IsNotEmpty()
  @Column({
    type: 'simple-json',
    name: 'option_values',
    nullable: false,
  })
  values: string[];

  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId: string;

  @ApiProperty({ required: false, type: () => Product })
  @ManyToOne(() => Product, (product) => product.options, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
