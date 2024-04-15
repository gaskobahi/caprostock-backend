import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateInsuranceCompanyDto } from './create-insurance-company.dto';

export class UpdateInsuranceCompanyDto extends PartialType(
  OmitType(CreateInsuranceCompanyDto, [] as const),
) {}
