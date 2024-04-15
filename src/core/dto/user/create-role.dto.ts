import { ApiProperty, PickType } from '@nestjs/swagger';
import { Role } from '../../entities/user/role.entity';
import { AccessToRole } from 'src/core/entities/user/access-to-role.entity';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserToBranchDto } from './create-user.dto';

export class CreateRoleDto extends PickType(Role, [
  'name',
  'displayName',
  'description',
  'isActive',
  'adminPermission',
  'permissions',
  'fieldPermissions',
] as const) {
  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAccessToRoleDto)
  @ApiProperty({
    type: () => [CreateAccessToRoleDto],
    description: `Accces auxquelles appartiennent le role`,
  })
  accessToRoles: CreateAccessToRoleDto[];
}

export class CreateAccessToRoleDto extends PickType(AccessToRole, [
  'accessId',
  'isSellerAccess',
  'isManagerAccess',
  'isOwnerAccess',
  'adminPermission',
  'permissions',
  'fieldPermissions',
  'accessType',
] as const) {}
