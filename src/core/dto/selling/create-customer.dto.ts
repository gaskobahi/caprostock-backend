import { ApiProperty, PickType } from '@nestjs/swagger';
import { Customer } from '../../entities/selling/customer.entity';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto extends PickType(Customer, [
  'firstName',
  'email',
  'address',
  'description',
  'code',
  'pointBalance',
] as const) {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Numéro de téléphone` })
  phoneNumber: string;
}
