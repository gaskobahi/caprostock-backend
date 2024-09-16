import { PickType } from '@nestjs/swagger';
import { Table } from 'src/core/entities/selling2/table.entity';

export class CreateTableDto extends PickType(Table, [
  'displayName',
  'description',
] as const) {}
