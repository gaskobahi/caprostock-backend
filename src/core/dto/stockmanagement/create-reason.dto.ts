import { PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Reason } from 'src/core/entities/stockmanagement/reason.entity';

export class CreateReasonDto extends PickType(Reason, [
  'name',
  'displayName',
  'description',
] as const) {
  @IsOptional()
  position: number;
}
