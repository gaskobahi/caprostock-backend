import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from '../../entities/product/brand.entity';
import { Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';

@Injectable()
export class BrandService extends AbstractService<Brand> {
  public NOT_FOUND_MESSAGE = `Marque non trouvée`;

  constructor(
    @InjectRepository(Brand)
    private _repository: Repository<Brand>,
    protected paginatedService: PaginatedService<Brand>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Brand> {
    return this._repository;
  }
}
