import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attribute } from '../../entities/product/attribute.entity';
import { Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';

@Injectable()
export class AttributeService extends AbstractService<Attribute> {
  public NOT_FOUND_MESSAGE = `Attribut non trouvé`;

  constructor(
    @InjectRepository(Attribute)
    private _repository: Repository<Attribute>,
    protected paginatedService: PaginatedService<Attribute>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Attribute> {
    return this._repository;
  }
}
