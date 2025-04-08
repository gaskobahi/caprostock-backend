import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { User } from '../user/user.entity';
import { BranchToProduct } from './branch-to-product.entity';
//import { Order } from '../supply/order.entity';
import { BranchToUser } from './branch-to-user.entity';
import { BranchToModifier } from './branch-to-modifier.entity';
import { BranchToTax } from './branch-to-tax.entity';
import { BranchToDining } from './branch-to-dining.entity';
import { Department } from '../setting/department.entity';
import { Order } from '../stockmanagement/order.entity';
import { Reception } from '../stockmanagement/reception.entity';
import { Production } from '../stockmanagement/production.entity';
import { Selling } from '../selling/selling.entity';
import { Delivery } from '../selling/delivery.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Branch extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Nom` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, description: `Actif` })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: `Téléphone` })
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ required: false, description: `Email` })
  @Column({ nullable: true })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: `Adresse` })
  @Column({ nullable: true })
  address: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: `Ville` })
  @Column({ nullable: true })
  city: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Maison mère`, default: false })
  @Column({ nullable: true, default: false })
  isParentCompany: boolean;

  @ApiProperty({ required: false, type: () => [User] })
  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @ApiProperty({ required: false, type: () => [Delivery] })
  @OneToMany(() => Delivery, (delivery) => delivery.branch, {
    cascade: true,
  })
  deliverys: Delivery[];

  @ApiProperty({ required: false, type: () => [BranchToProduct] })
  @OneToMany(() => BranchToProduct, (banchToProduct) => banchToProduct.branch, {
    cascade: true,
  })
  branchToProducts: BranchToProduct[];

  @ApiProperty({ required: false, type: () => [BranchToUser] })
  @OneToMany(() => BranchToUser, (branchToUser) => branchToUser.branch, {
    cascade: true,
  })
  branchToUsers: BranchToUser[];

  @ApiProperty({ required: false, type: () => [BranchToModifier] })
  @OneToMany(
    () => BranchToModifier,
    (branchToModifier) => branchToModifier.modifier,
    {
      cascade: true,
    },
  )
  branchToModifiers: BranchToModifier[];

  @ApiProperty({ required: false, type: () => [BranchToTax] })
  @OneToMany(() => BranchToTax, (branchToTax) => branchToTax.tax, {
    cascade: true,
  })
  branchToTaxs: BranchToTax[];

  @ApiProperty({ required: false, type: () => [BranchToDining] })
  @OneToMany(() => BranchToDining, (branchToDining) => branchToDining.dining, {
    cascade: true,
  })
  branchToDinings: BranchToDining[];

  @ApiProperty({ required: false, type: () => [Department] })
  @OneToMany(() => Department, (department) => department.branch, {
    cascade: true,
  })
  departments: Department[];

  @ApiProperty({ required: false, type: () => [Order] })
  @OneToMany(() => Order, (order) => order.branch, {
    cascade: true,
  })
  orders: Order[];

  @ApiProperty({ required: false, type: () => [Selling] })
  @OneToMany(() => Selling, (selling) => selling.branch, {
    cascade: true,
  })
  sellings: Selling[];

  @ApiProperty({ required: false, type: () => [Reception] })
  @OneToMany(() => Reception, (reception) => reception.branch, {
    cascade: true,
  })
  receptions: Reception[];

  @ApiProperty({ required: false, type: () => [Production] })
  @OneToMany(() => Production, (production) => production.branch, {
    cascade: true,
  })
  productions: Production[];
}
