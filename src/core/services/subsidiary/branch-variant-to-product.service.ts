import { PaginatedService } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { REQUEST } from '@nestjs/core';
import { BranchVariantToProduct } from 'src/core/entities/subsidiary/branch-variant-to-product.entity';

@Injectable()
export class BranchVariantToProductService extends AbstractService<BranchVariantToProduct> {
  public NOT_FOUND_MESSAGE = `Branch variant non trouvé dans la succursale`;
  public readonly entity = BranchVariantToProduct;

  constructor(
    @InjectRepository(BranchVariantToProduct)
    private _repository: Repository<BranchVariantToProduct>,
    protected paginatedService: PaginatedService<BranchVariantToProduct>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<BranchVariantToProduct> {
    return this._repository;
  }
}
