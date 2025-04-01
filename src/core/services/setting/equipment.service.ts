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
import { Equipment } from 'src/core/entities/setting/equipment.entity';
import { UpdateEquipmentDto } from 'src/core/dto/setting/update-equipment.dto';
import { CreateEquipmentDto } from 'src/core/dto/setting/create-equipment.dto';

@Injectable()
export class EquipmentService extends AbstractService<Equipment> {
  public NOT_FOUND_MESSAGE = `Caisse non trouvée`;

  constructor(
    @InjectRepository(Equipment)
    private _repository: Repository<Equipment>,
    protected paginatedService: PaginatedService<Equipment>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Equipment> {
    console.log('sdsdsd', dto);
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Equipment,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Equipment>,
    dto: UpdateEquipmentDto,
  ) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Equipment,
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

  get repository(): Repository<Equipment> {
    return this._repository;
  }
}
