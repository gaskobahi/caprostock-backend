import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePinDto } from '../../dto/user/create-pin.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Pin } from '../../entities/user/pin.entity';
import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import { AbstractService } from '../abstract.service';
import { generate } from 'generate-password';
import { UpdatePinDto } from 'src/core/dto/user/update-pin.dto';

@Injectable()
export class PinService extends AbstractService<Pin> {
  public NOT_FOUND_MESSAGE = `Rôle non trouvé`;

  constructor(
    @InjectRepository(Pin)
    private _repository: Repository<Pin>,
    protected paginatedService: PaginatedService<Pin>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Pin> {
    return this._repository;
  }

  async generateCodePin() {
    let code: string;
    let existsCount: number;
    do {
      code = generate({
        numbers: true,
        length: 4,
        strict: true,
        lowercase: false,
        uppercase: false,
        excludeSimilarCharacters: true,
      });

      existsCount = await this._repository.countBy({
        code: code,
      });
    } while (existsCount > 0);

    return { code: code };
  }
  async createRecord(dto: CreatePinDto) {
    // Check unique name
    if (dto.code) {
      await isUniqueConstraint(
        'code',
        Pin,
        { code: dto.code },
        { message: `Le code "${dto.code}" du pin est déjà utilisé` },
      );
    }

    return await super.createRecord(dto);
  }
  async updateRecord(optionsWhere: FindOptionsWhere<Pin>, dto: UpdatePinDto) {
    // Check unique name
    if (dto.code) {
      await isUniqueConstraintUpdate(
        'code',
        Pin,
        { code: dto.code, id: optionsWhere.id },
        { message: `Le code "${dto.code}" du pin est déjà utilisé` },
      );
    }

    return await super.updateRecord(optionsWhere, dto);
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<Pin>) {
    return await super.deleteRecord(optionsWhere);
  }

  async getByCode(code: string): Promise<Pin> {
    return this._repository.findOneBy({
      code: code,
    });
  }

 
}
