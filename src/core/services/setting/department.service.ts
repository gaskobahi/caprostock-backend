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
import { Department } from 'src/core/entities/setting/department.entity';
import { UpdateDepartmentDto } from 'src/core/dto/setting/update-department.dto';

@Injectable()
export class DepartmentService extends AbstractService<Department> {
  public NOT_FOUND_MESSAGE = `Caisse non trouvée`;

  constructor(
    @InjectRepository(Department)
    private _repository: Repository<Department>,
    protected paginatedService: PaginatedService<Department>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: any): Promise<Department> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Department,
        { displayName: dto.displayName, branchId: dto.branchId },
        {
          message: `Le nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Department>,
    dto: UpdateDepartmentDto,
  ) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Department,
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

  get repository(): Repository<Department> {
    return this._repository;
  }
}
