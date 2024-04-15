import { PaginatedService } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchToProduct } from '../../entities/subsidiary/branch-to-product.entity';
import { AbstractService } from '../abstract.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class BranchToProductService extends AbstractService<BranchToProduct> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé dans la succursale`;

  constructor(
    @InjectRepository(BranchToProduct)
    private _repository: Repository<BranchToProduct>,
    protected paginatedService: PaginatedService<BranchToProduct>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<BranchToProduct> {
    return this._repository;
  }
}
