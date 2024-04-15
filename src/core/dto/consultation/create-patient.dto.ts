import { PickType } from '@nestjs/swagger';
import { Patient } from '../../entities/consultation/patient.entity';

export class CreatePatientDto extends PickType(Patient, [
  'firstName',
  'lastName',
  'age',
  'email',
  'phoneNumber',
  'address',
  'description',
] as const) {}
