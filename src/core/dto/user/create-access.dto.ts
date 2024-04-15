import { PickType } from '@nestjs/swagger';
import { Role } from '../../entities/user/role.entity';
import { Access } from 'src/core/entities/user/access.entity';

export class CreateAccessDto extends PickType(Access, [
  'name',
  'displayName',
  'description',
  'adminPermission',
  'permissions',
  'fieldPermissions',
] as const) {}
