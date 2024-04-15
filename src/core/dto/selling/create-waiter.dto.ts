import { ApiProperty, PickType } from '@nestjs/swagger';
import { Waiter } from '../../entities/selling/waiter.entity';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWaiterDto extends PickType(Waiter, [
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
