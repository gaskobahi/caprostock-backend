import { PickType } from '@nestjs/swagger';
import { Section } from 'src/core/entities/setting/section.entity';

export class CreateSectionDto extends PickType(Section, [
  'name',
  'displayName',
] as const) {}
