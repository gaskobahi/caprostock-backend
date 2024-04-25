import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { BranchToTax } from '../subsidiary/branch-to-tax.entity';
import { TaxOptionEnum, TaxTypeEnum } from 'src/core/definitions/enums';
import { TaxToProduct } from '../product/tax-to-product.entity';
import { DiningToTax } from './dining-to-tax.entity';
//import { OptionToTax } from './option-to-tax.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Tax extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: `Tax ` })
  @Column({ type: 'double precision', default: 0 })
  taxRate: number;

  @IsNotEmpty()
  @IsIn(Object.values(TaxTypeEnum))
  @ApiProperty({
    enum: TaxTypeEnum,
    enumName: 'TaxTypeEnum',
    description: `Type de tax`,
  })
  @Column({ name: 'type', default: TaxTypeEnum.includeInPrice })
  type: TaxTypeEnum;

  @IsNotEmpty()
  @IsIn(Object.values(TaxOptionEnum))
  @ApiProperty({
    enum: TaxOptionEnum,
    enumName: 'TaxOptionEnum',
    description: `Option de tax`,
  })
  @Column({ name: 'option', default: TaxOptionEnum.other })
  option: TaxOptionEnum;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    default: false,
    description: `option de restauration (livraison)`,
  })
  @Column({ name: 'has_dining', nullable: true })
  hasDining: boolean;

  @ApiProperty({ required: false, type: () => [BranchToTax] })
  @OneToMany(() => BranchToTax, (branchToTax) => branchToTax.tax, {
    cascade: true,
  })
  branchToTaxs: BranchToTax[];

  @ApiProperty({ required: false, type: () => [TaxToProduct] })
  @OneToMany(() => TaxToProduct, (taxToProduct) => taxToProduct.tax, {
    cascade: true,
  })
  taxToProducts: TaxToProduct[];

  @ApiProperty({ required: false, type: () => [DiningToTax] })
  @OneToMany(() => DiningToTax, (diningToTax) => diningToTax.tax, {
    cascade: true,
  })
  diningToTaxs: DiningToTax[];

  /* @ApiProperty({ required: false, type: () => [TaxToProduct] })
  @OneToMany(
    () => TaxToProduct,
    (taxToProduct) => taxToProduct.tax,
    {
      cascade: true,
    },
  )
  taxToProducts: TaxToProduct[];*/

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
