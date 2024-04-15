import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsultType } from '../../entities/consultation/consult-type.entity';
import { Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';

@Injectable()
export class ConsultTypeService extends AbstractService<ConsultType> {
  public NOT_FOUND_MESSAGE = `Type de consultation non trouvé`;

  constructor(
    @InjectRepository(ConsultType)
    private _repository: Repository<ConsultType>,
    protected paginatedService: PaginatedService<ConsultType>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<ConsultType> {
    return this._repository;
  }
}
