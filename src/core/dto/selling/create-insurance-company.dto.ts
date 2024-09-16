import { PickType } from '@nestjs/swagger';
import { InsuranceCompany } from '../../entities/selling2/insurance-company.entity';

export class CreateInsuranceCompanyDto extends PickType(InsuranceCompany, [
  'displayName',
  'description',
] as const) {}
