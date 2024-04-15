import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Supplier } from '../../entities/supply/supplier.entity';
import { Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';

@Injectable()
export class SupplierService extends AbstractService<Supplier> {
  public NOT_FOUND_MESSAGE = `Fournisseur non trouvé`;

  constructor(
    @InjectRepository(Supplier)
    private _repository: Repository<Supplier>,
    protected paginatedService: PaginatedService<Supplier>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Supplier> {
    return this._repository;
  }
}
