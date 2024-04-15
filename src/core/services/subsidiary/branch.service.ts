import { PaginatedService } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Branch } from '../../entities/subsidiary/branch.entity';
import { AbstractService } from '../abstract.service';

@Injectable()
export class BranchService extends AbstractService<Branch> {
  public NOT_FOUND_MESSAGE = `Succursale non trouvée`;

  constructor(
    @InjectRepository(Branch) private _repository: Repository<Branch>,
    protected paginatedService: PaginatedService<Branch>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Branch> {
    return this._repository;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Branch>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        id: authUser.targetBranchId,
      };
    }

    return {};
  }
}
