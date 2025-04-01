import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Equipment } from './equipment.entity';
import { EquipmentType } from './equipment-type.entity';
import { Customer } from '../selling/customer.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Section extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Name` })
  @Index()
  @Column({ name: 'name' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Libellé` })
  @Column({ name: 'display_name' })
  displayName: string;

  @ApiProperty({ required: false, type: () => [Equipment] })
  @OneToMany(() => Equipment, (equipment) => equipment.section, {
    cascade: true,
  })
  equipments: Equipment[];

  @ApiProperty({ required: false, type: () => [Customer] })
  @OneToMany(() => Customer, (customer) => customer.department, {
    cascade: true,
  })
  customers: Customer[];

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
