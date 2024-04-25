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
import { Dining } from 'src/core/entities/setting/dining.entity';
import { UpdateDiningDto } from 'src/core/dto/setting/update-dining.dto';

@Injectable()
export class DiningService extends AbstractService<Dining> {
  public NOT_FOUND_MESSAGE = `Marque non trouvée`;

  constructor(
    @InjectRepository(Dining)
    private _repository: Repository<Dining>,
    protected paginatedService: PaginatedService<Dining>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Dining> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Dining,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Dining>,
    dto: UpdateDiningDto,
  ) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Dining,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Dining> {
    return this._repository;
  }
}
