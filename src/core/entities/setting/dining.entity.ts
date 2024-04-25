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
import { BranchToDining } from '../subsidiary/branch-to-dining.entity';
import { DiningToTax } from './dining-to-tax.entity';
//import { OptionToTax } from './option-to-tax.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Dining extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @ApiProperty({ required: false, type: () => [BranchToDining] })
  @OneToMany(() => BranchToDining, (branchToDining) => branchToDining.dining, {
    cascade: true,
  })
  branchToDinings: BranchToDining[];

  @ApiProperty({ required: false, type: () => [DiningToTax] })
  @OneToMany(() => DiningToTax, (diningToTax) => diningToTax.dining, {
    cascade: true,
  })
  diningToTaxs: DiningToTax[];

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
