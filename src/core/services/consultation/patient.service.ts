import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from '../../entities/consultation/patient.entity';
import { Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';

@Injectable()
export class PatientService extends AbstractService<Patient> {
  public NOT_FOUND_MESSAGE = `Patient non trouvé`;

  constructor(
    @InjectRepository(Patient)
    private _repository: Repository<Patient>,
    protected paginatedService: PaginatedService<Patient>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Patient> {
    return this._repository;
  }
}
