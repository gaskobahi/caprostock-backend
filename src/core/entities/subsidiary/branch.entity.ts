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
import { Order } from '../supply/order.entity';
import { Sale } from '../selling/sale.entity';
import { BranchToUser } from './branch-to-user.entity';

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

  @ApiProperty({ required: false, type: () => [Order] })
  @OneToMany(() => Order, (order) => order.branch, {
    cascade: true,
  })
  orders: Order[];

  @ApiProperty({ required: false, type: () => [Sale] })
  @OneToMany(() => Order, (sale) => sale.branch, {
    cascade: true,
  })
  sales: Sale[];
}
