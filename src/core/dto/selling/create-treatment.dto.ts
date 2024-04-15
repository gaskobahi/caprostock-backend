import { PickType } from '@nestjs/swagger';
import { Treatment } from '../../entities/selling/treatment.entity';

export class CreateTreatmentDto extends PickType(Treatment, [
  'displayName',
] as const) {}
