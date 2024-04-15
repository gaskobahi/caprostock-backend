import { PickType } from '@nestjs/swagger';
import { ConsultType } from '../../entities/consultation/consult-type.entity';

export class CreateConsultTypeDto extends PickType(ConsultType, [
  'displayName',
  'description',
] as const) {}
