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
import { EquipmentType } from 'src/core/entities/setting/equipment-type.entity';
import { UpdateEquipmentTypeDto } from 'src/core/dto/setting/update-equipment-type.dto';
@Injectable()
export class EquipmentTypeService extends AbstractService<EquipmentType> {
  public NOT_FOUND_MESSAGE = `Type équipement non trouvée`;

  constructor(
    @InjectRepository(EquipmentType)
    private _repository: Repository<EquipmentType>,
    protected paginatedService: PaginatedService<EquipmentType>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<EquipmentType> {
    // Check unique displayName
    if (dto.name) {
      await isUniqueConstraint(
        'name',
        EquipmentType,
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
        EquipmentType,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<EquipmentType>,
    dto: UpdateEquipmentTypeDto,
  ) {
    if (dto.name) {
      await isUniqueConstraintUpdate(
        'name',
        EquipmentType,
        {
          name: dto.name,
          id: optionsWhere.id,
        },
        { message: `Le à afficher "${dto.displayName}" est déjà utilisé` },
      );
    }
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        EquipmentType,
        {
          displayName: dto.displayName,
          id: optionsWhere.id,
        },
        { message: `Le à afficher "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<EquipmentType> {
    return this._repository;
  }
}
