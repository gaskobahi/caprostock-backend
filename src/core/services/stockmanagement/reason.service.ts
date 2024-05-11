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
import { Reason } from 'src/core/entities/stockmanagement/reason.entity';
import { UpdateReasonDto } from 'src/core/dto/stockmanagement/update-reason.dto';

@Injectable()
export class ReasonService extends AbstractService<Reason> {
  public NOT_FOUND_MESSAGE = `Marque non trouvée`;

  constructor(
    @InjectRepository(Reason)
    private _repository: Repository<Reason>,
    protected paginatedService: PaginatedService<Reason>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Reason> {
    // Check unique name
    if (dto.name) {
      await isUniqueConstraint(
        'name',
        Reason,
        { name: dto.name },
        {
          message: `Le nom "${dto.name}" est déjà utilisée`,
        },
      );
    }

    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Reason,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Reason>,
    dto: UpdateReasonDto,
  ) {
    // Check unique displayName
    if (dto.name) {
      await isUniqueConstraintUpdate(
        'name',
        Reason,
        { name: dto.name },
        {
          message: `Le nom "${dto.name}" est déjà utilisée`,
        },
      );
    }
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Reason,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Reason> {
    return this._repository;
  }
}
