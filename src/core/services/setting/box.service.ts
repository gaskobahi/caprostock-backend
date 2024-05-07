import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintBranch,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { Box } from 'src/core/entities/setting/box.entity';
import { UpdateBoxDto } from 'src/core/dto/setting/update-box.dto';

@Injectable()
export class BoxService extends AbstractService<Box> {
  public NOT_FOUND_MESSAGE = `Caisse non trouvée`;

  constructor(
    @InjectRepository(Box)
    private _repository: Repository<Box>,
    protected paginatedService: PaginatedService<Box>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Box> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Box,
        { displayName: dto.displayName, branchId: dto.branchId },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(optionsWhere: FindOptionsWhere<Box>, dto: UpdateBoxDto) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Box,
        {
          displayName: dto.displayName,
          branchId: dto.branchId,
          id: optionsWhere.id,
        },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Box> {
    return this._repository;
  }
}
