import { ApiProperty, PickType } from '@nestjs/swagger';
import { Customer } from '../../entities/selling/customer.entity';
import { IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto extends PickType(Customer, [
  'firstName',
  'lastName',
  'email',
  'address',
  'description',
  'code',
  'pointBalance',
] as const) {
  @IsOptional()
  @ApiProperty({
    type: () => String,
    description: `departement du client `,
  })
  departmentId: string;

  @IsOptional()
  @ApiProperty({
    type: () => String,
    description: `section du client `,
  })
  sectionId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Numéro de téléphone` })
  phoneNumber: string;
}
