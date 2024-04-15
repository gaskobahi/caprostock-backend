import { ApiProperty, PickType } from '@nestjs/swagger';
import { Customer } from '../../entities/selling/customer.entity';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCustomerDto extends PickType(Customer, [
  'firstName',
  'lastName',
  'email',
  'address',
  'description',
] as const) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Numéro de téléphone` })
  phoneNumber: string;
}
