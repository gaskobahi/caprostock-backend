import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { Loyalty } from 'src/core/entities/setting/loyalty.entity';
import { UpdateLoyaltyDto } from 'src/core/dto/setting/update-loyalty.dto';

@Injectable()
export class LoyaltyService extends AbstractService<Loyalty> {
  public NOT_FOUND_MESSAGE = `Loyalty non trouvée`;

  constructor(
    @InjectRepository(Loyalty)
    private _repository: Repository<Loyalty>,
    protected paginatedService: PaginatedService<Loyalty>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Loyalty> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Loyalty,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Loyalty>,
    dto: UpdateLoyaltyDto,
  ) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Loyalty,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Loyalty> {
    return this._repository;
  }
}
