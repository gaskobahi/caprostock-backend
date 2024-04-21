import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { OptionToModifier } from './option-to-modifier.entity';
import { BranchToModifier } from '../subsidiary/branch-to-modifier.entity';
import { Product } from './product.entity';
import { ModifierToProduct } from './modifier-to-product.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Modifier extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Index()
  @Column({ name: 'display_name' })
  displayName: string;

  @ApiProperty({ required: false, type: () => [OptionToModifier] })
  @OneToMany(
    () => OptionToModifier,
    (optionToModifier) => optionToModifier.modifier,
    {
      cascade: true,
    },
  )
  optionToModifiers: OptionToModifier[];

  @ApiProperty({ required: false, type: () => [BranchToModifier] })
  @OneToMany(
    () => BranchToModifier,
    (branchToModifier) => branchToModifier.modifier,
    {
      cascade: true,
    },
  )
  branchToModifiers: BranchToModifier[];

  @ApiProperty({ required: false, type: () => [ModifierToProduct] })
  @OneToMany(
    () => ModifierToProduct,
    (modifierToProduct) => modifierToProduct.modifier,
    {
      cascade: true,
    },
  )
  modifierToProducts: ModifierToProduct[];

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
