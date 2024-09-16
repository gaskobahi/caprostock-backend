import { PickType } from '@nestjs/swagger';
import { Treatment } from '../../entities/selling2/treatment.entity';

export class CreateTreatmentDto extends PickType(Treatment, [
  'displayName',
] as const) {}
