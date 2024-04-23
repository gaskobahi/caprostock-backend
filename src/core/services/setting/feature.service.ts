import { PaginatedService } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { Feature } from 'src/core/entities/setting/feature.entity';
import { CreateFeatureArrayDto } from 'src/core/dto/setting/create-featurearray.dto';

@Injectable()
export class FeatureService extends AbstractService<Feature> {
  public NOT_FOUND_MESSAGE = `Succursale non trouvée`;

  constructor(
    @InjectRepository(Feature) private _repository: Repository<Feature>,
    protected paginatedService: PaginatedService<Feature>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Feature> {
    return this._repository;
  }

  async createArrayRecord(dto: CreateFeatureArrayDto): Promise<Feature> {
    let res;
    for (const dt of dto.features) {
      res = await this.repository.update(dt.id, dt);
    }
    return res;
  }
  /*async getFilterByAuthUserFeature(): Promise<FindOptionsWhere<Feature>> {
    const authUser = await super.checkSessionFeature();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        id: authUser.targetFeatureId,
      };
    }

    return {};
  }*/
}
