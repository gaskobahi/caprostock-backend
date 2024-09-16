import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateOpenTicketDto,
  CreateOpenticketToPredefinedDto,
} from './create-open-ticket.dto';

export class UpdateOpenTicketDto extends PartialType(
  OmitType(CreateOpenTicketDto, ['openticketToPredefined'] as const),
) {
  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOpenticketToPredefinedDto)
  @ApiProperty({
    type: () => [UpdateOpenticketToPredefinedDto],
    description: `Les elements des tickets ouverts`,
  })
  openticketToPredefined: UpdateOpenticketToPredefinedDto[];
}

export class UpdateOpenticketToPredefinedDto extends PartialType(
  OmitType(CreateOpenticketToPredefinedDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
