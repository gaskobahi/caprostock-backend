import { CreateDepartmentDto } from './create-department.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdateDepartmentDto extends PartialType(
  OmitType(CreateDepartmentDto, [] as const),
) {}
