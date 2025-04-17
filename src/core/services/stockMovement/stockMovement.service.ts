import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedService } from '@app/typeorm';
import { REQUEST } from '@nestjs/core';
import { AbstractService } from '../abstract.service';
import { StockMovement } from 'src/core/entities/stockmovement/stockmovement.entity';
import { CreateStockMovementDto } from 'src/core/dto/stockMovement/create-stockMovement.dto';
import { UpdateStockMovementDto } from 'src/core/dto/stockMovement/update-stockMovement.dto';

@Injectable()
export class StockMovementService extends AbstractService<StockMovement> {
  public NOT_FOUND_MESSAGE = `Mouvement de stock non trouvé`;
  public readonly entity = StockMovement;

  constructor(
    @InjectRepository(StockMovement)
    private _repository: Repository<StockMovement>,
    protected paginatedService: PaginatedService<StockMovement>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  async createRecord(dto: CreateStockMovementDto): Promise<StockMovement> {
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<StockMovement>,
    dto: UpdateStockMovementDto,
  ) {
    return await super.updateRecord(optionsWhere, {
      ...dto,
    });
  }

  get repository(): Repository<StockMovement> {
    return this._repository;
  }
}
