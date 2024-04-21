import { PaginatedService } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxToProduct } from '../../entities/product/tax-to-product.entity';
import { AbstractService } from '../abstract.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class TaxToProductService extends AbstractService<TaxToProduct> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé dans la succursale`;

  constructor(
    @InjectRepository(TaxToProduct)
    private _repository: Repository<TaxToProduct>,
    protected paginatedService: PaginatedService<TaxToProduct>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<TaxToProduct> {
    return this._repository;
  }
}
