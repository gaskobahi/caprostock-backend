import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../../entities/product/category.entity';
import { Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';

@Injectable()
export class CategoryService extends AbstractService<Category> {
  public NOT_FOUND_MESSAGE = `Marque non trouvée`;

  constructor(
    @InjectRepository(Category)
    private _repository: Repository<Category>,
    protected paginatedService: PaginatedService<Category>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Category> {
    return this._repository;
  }
}
