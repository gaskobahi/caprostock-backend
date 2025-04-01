import { ApiProperty, PickType } from '@nestjs/swagger';
import { Department } from '../../entities/setting/department.entity';
import { IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto extends PickType(Department, [
  'displayName',
  'branchId',
] as const) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    type: () => String,
    description: ` description `,
  })
  description: string;
}
