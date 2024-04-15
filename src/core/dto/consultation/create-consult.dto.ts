import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Consult } from '../../entities/consultation/consult.entity';
import { CreatePatientDto } from './create-patient.dto';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConsultPatientDto extends PartialType(
  OmitType(CreatePatientDto, [] as const),
) {
  @IsNotEmpty()
  @IsUUID()
  @ValidateIf((p: CreatePatientDto) => !(p.lastName && p.firstName))
  @ApiPropertyOptional()
  id: string;
}

export class CreateConsultDto extends PickType(Consult, [
  'externalId',
  'amount',
  'date',
  'inStorePurchase',
  'description',
  'doctorId',
  'consultTypeId',
] as const) {
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ConsultPatientDto)
  @ApiProperty({ type: () => ConsultPatientDto })
  patient: ConsultPatientDto;
}
