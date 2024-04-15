import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from '../../entities/consultation/doctor.entity';
import { Repository } from 'typeorm';
import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { CreateDoctorDto } from '../../dto/consultation/create-doctor.dto';

@Injectable()
export class DoctorService extends AbstractService<Doctor> {
  public NOT_FOUND_MESSAGE = `Opticien non trouvé`;

  constructor(
    @InjectRepository(Doctor)
    private _repository: Repository<Doctor>,
    protected paginatedService: PaginatedService<Doctor>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Doctor> {
    return this._repository;
  }

  async createRecord(dto: CreateDoctorDto): Promise<Doctor> {
    // Check unique matricule
    if (dto.matricule) {
      await isUniqueConstraint(
        'matricule',
        Doctor,
        { matricule: dto.matricule },
        {
          message: `Le matricule "${dto.matricule}" du medecin est déjà utilisé`,
        },
      );
    }

    return await super.createRecord(dto);
  }
}
