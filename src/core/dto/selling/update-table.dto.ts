import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTableDto } from './create-table.dto';

export class UpdateTableDto extends PartialType(
  OmitType(CreateTableDto, [] as const),
) {}
