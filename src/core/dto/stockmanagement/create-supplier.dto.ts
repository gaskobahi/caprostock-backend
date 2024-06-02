import { ApiProperty, PickType } from '@nestjs/swagger';
import { Supplier } from '../../entities/stockmanagement/supplier.entity';
import { IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto extends PickType(Supplier, [
  'firstName',
  'email',
  'address',
  'description',
] as const) {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Numéro de téléphone` })
  phoneNumber: string;
}
