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
import { Section } from 'src/core/entities/setting/section.entity';
import { UpdateSectionDto } from 'src/core/dto/setting/update-section.dto';

@Injectable()
export class SectionService extends AbstractService<Section> {
  public NOT_FOUND_MESSAGE = `Caisse non trouvée`;

  constructor(
    @InjectRepository(Section)
    private _repository: Repository<Section>,
    protected paginatedService: PaginatedService<Section>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Section> {
    // Check unique displayName
    if (dto.name) {
      await isUniqueConstraint(
        'name',
        Section,
        { name: dto.name },
        {
          message: `Le nom "${dto.name}" est déjà utilisée`,
        },
      );
    }
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Section,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Section>,
    dto: UpdateSectionDto,
  ) {
    // Check unique name
    if (dto.name) {
      await isUniqueConstraintUpdate(
        'name',
        Section,
        {
          name: dto.name,
          id: optionsWhere.id,
        },
        { message: `Le nom "${dto.name}" est déjà utilisé` },
      );
    }
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Section,
        {
          displayName: dto.displayName,
          id: optionsWhere.id,
        },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<Section> {
    return this._repository;
  }
}
