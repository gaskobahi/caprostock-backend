import { PaginatedService } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { REQUEST } from '@nestjs/core';
import { VariantToProduct } from 'src/core/entities/product/variant-to-product.entity';

@Injectable()
export class VariantToProductService extends AbstractService<VariantToProduct> {
  public NOT_FOUND_MESSAGE = `Branch variant non trouvé dans la succursale`;
  public readonly entity = VariantToProduct;

  constructor(
    @InjectRepository(VariantToProduct)
    private _repository: Repository<VariantToProduct>,
    protected paginatedService: PaginatedService<VariantToProduct>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<VariantToProduct> {
    return this._repository;
  }
}
