import { ApiProperty, PickType } from '@nestjs/swagger';
import { OpenTicket } from '../../entities/selling/open-ticket.entity';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { OpenticketToPredefined } from 'src/core/entities/selling/openticket-to-predefined.entity';
import { Type } from 'class-transformer';

export class CreateOpenTicketDto extends PickType(OpenTicket, [
  'isPredefined',
  'branchId',
] as const) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateOpenticketToPredefinedDto)
  @ApiProperty({
    type: () => [CreateOpenticketToPredefinedDto],
    description: `Les element(table) des tickets predefinis de chaque branche`,
  })
  openticketToPredefined: CreateOpenticketToPredefinedDto[];
}

export class CreateOpenticketToPredefinedDto extends PickType(
  OpenticketToPredefined,
  ['displayName'] as const,
) {}
