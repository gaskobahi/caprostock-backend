import { PickType } from '@nestjs/swagger';
import { InsuranceCompany } from '../../entities/selling/insurance-company.entity';

export class CreateInsuranceCompanyDto extends PickType(InsuranceCompany, [
  'displayName',
  'description',
] as const) {}
