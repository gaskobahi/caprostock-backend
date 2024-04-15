import { User } from '../../entities/user/user.entity';
import {
  IsArray,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Pin } from 'src/core/entities/user/pin.entity';
import { BranchToUser } from 'src/core/entities/subsidiary/branch-to-user.entity';

export class CreatePinToUserDto extends PickType(Pin, ['code'] as const) {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional()
  id: string;
}

export class CreateUserDto extends PickType(User, [
  'username',
  'email',
  'isActive',
  'isPinActive',
  'hasPinCode',
  'phoneNumber',
  'firstName',
  'lastName',
  'isInviteToBo',
  'address',
  'roleId',
  //'branchId',
] as const) {
  @ApiPropertyOptional({ minLength: 3, description: `Mot de passe` })
  @IsOptional()
  @IsString()
  @MinLength(3)
  newPassword: string;

  @IsObject()
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CreatePinToUserDto)
  @ApiProperty({ type: () => CreatePinToUserDto })
  pin: CreatePinToUserDto;

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserToBranchDto)
  @ApiProperty({
    type: () => [CreateUserToBranchDto],
    description: `Surcusale auxquelles appartiennent l'utilisateur`,
  })
  branchToUsers: CreateUserToBranchDto[];
}

export class CreateUserToBranchDto extends PickType(BranchToUser, [
  'branchId',
] as const) {}
