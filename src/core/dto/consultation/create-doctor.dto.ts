import { PickType } from '@nestjs/swagger';
import { Doctor } from '../../entities/consultation/doctor.entity';

export class CreateDoctorDto extends PickType(Doctor, [
  'matricule',
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'address',
  'description',
] as const) {}
