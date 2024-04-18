import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Modifier } from '../../entities/product/modifier.entity';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { ConfigService } from '../system/config.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { UpdateModifierDto } from 'src/core/dto/product/update-modifier.dto';
import { CreateModifierDto } from 'src/core/dto/product/create-modifier.dto';

@Injectable()
export class ModifierService extends AbstractService<Modifier> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé`;

  constructor(
    @InjectRepository(Modifier)
    private _repository: Repository<Modifier>,
    private readonly configService: ConfigService,
    protected paginatedService: PaginatedService<Modifier>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Modifier> {
    return this._repository;
  }

  async createRecord(dto: CreateModifierDto): Promise<Modifier> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displaName',
        Modifier,
        { displayName: dto.displayName },
        {
          message: `La nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Modifier>,
    dto: UpdateModifierDto,
  ) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Modifier,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Modifier>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchToModifiers: {
          branchId: authUser.targetBranchId,
        },
      };
    }

    return {};
  }

  async readOneRecord(options?: FindOneOptions<Modifier>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    return entity;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<Modifier>) {
    const entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    entity.updatedById = authUser?.id;
    entity.deletedById = authUser?.id;
    return await this.repository.remove(entity);
  }
}
