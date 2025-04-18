import { PaginatedService } from '@app/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { AbstractService } from '../abstract.service';
import { ConfigService } from '../system/config.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { StockAdjustment } from 'src/core/entities/stockmanagement/stockadjustment.entity';
import { CreateStockAdjustmentDto } from 'src/core/dto/stockmanagement/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from 'src/core/dto/stockmanagement/update-stock-adjustment.dto';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { ReasonService } from './reason.service';
import {
  DefaultReasonTypeEnum,
  ReasonTypeEnum,
  StockMovementSourceEnum,
  StockMovementTypeEnum,
} from 'src/core/definitions/enums';
import { ProductService } from '../product/product.service';
import { Product } from 'src/core/entities/product/product.entity';
import { Reason } from 'src/core/entities/stockmanagement/reason.entity';
import { RunInTransactionService } from '../transaction/runInTransaction.service';
import { StockMovementService } from '../stockMovement/stockMovement.service';

@Injectable()
export class StockAdjustmentService extends AbstractService<StockAdjustment> {
  public NOT_FOUND_MESSAGE = `Ajustement de stock non trouvé`;

  constructor(
    @InjectRepository(StockAdjustment)
    private _repository: Repository<StockAdjustment>,
    private readonly configService: ConfigService,
    private readonly branchToProductService: BranchToProductService,
    private readonly branchVariantToProductService: BranchVariantToProductService,
    private readonly reasonService: ReasonService,
    private readonly productService: ProductService,
    private readonly runInTransactionService: RunInTransactionService,
    private readonly stockMovementService: StockMovementService,

    protected paginatedService: PaginatedService<StockAdjustment>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<StockAdjustment> {
    return this._repository;
  }

  async readPaginatedListRecord(
    options?: FindManyOptions<StockAdjustment>,
    page: number = 1,
    perPage: number = 25,
  ) {
    // Paginate using provided options, page, and perPage
    const response = await this.paginatedService.paginate(
      this.repository,
      page,
      perPage,
      options,
    );

    // Update response data with processed items and return
    return response;
  }

  /*async createRecord(dto: CreateStockAdjustmentDto): Promise<StockAdjustment> {
    const reason = await this.reasonService.readOneRecord({
      where: { id: dto.reasonId },
    });
    //calcul du afterquantity en fonction du type de raison
    if (
      reason.name == DefaultReasonTypeEnum.loss ||
      reason.name == DefaultReasonTypeEnum.damage
    ) {
      for (const el of dto.productToStockAdjustments) {
        if (el.inStock < el.quantity || el.inStock == 0) {
          throw new BadRequestException('Impossible de reduit le stock');
        }
        el.afterQuantity = el.inStock - el.quantity;
      }
    }

    if (reason.name == DefaultReasonTypeEnum.receiveItem) {
      for (const el of dto.productToStockAdjustments) {
        el.afterQuantity = el.inStock + el.quantity;
      }
    }
    if (reason.name == DefaultReasonTypeEnum.inventoryCount) {
      for (const el of dto.productToStockAdjustments) {
        el.afterQuantity = el.quantity;
      }
    }

    const result = await super.createRecord({ ...dto });

    if (result) {
      for (const ps of dto.productToStockAdjustments) {
        //find product by Id
        const prd = await this.productService.readOneRecord({
          relations: { variantToProducts: true },
          where: { id: ps.productId },
        });
        //update branch for product variant
        if (prd.hasVariant) {
          const vp = prd.variantToProducts.find((el) => el.sku == ps.sku);
          await this.branchVariantToProductService.updateRecord(
            {
              variantId: vp.id,
              branchId: dto.branchId,
            },
            { price: ps.cost, inStock: ps.afterQuantity },
          );
        } else {
          //update branch for product
          await this.branchToProductService.updateRecord(
            {
              productId: ps.productId,
              branchId: dto.branchId,
            },
            { price: ps.cost, inStock: ps.afterQuantity },
          );
        }
      }
    }
    return result as any;
  }*/

  async createRecord(dto: CreateStockAdjustmentDto): Promise<any> {
    const reason = await this.getReasonById(dto.reasonId);
    this.calculateAfterQuantities(dto, reason);
    await this.runInTransactionService.runInTransaction(async (manager) => {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      const stockAdjustment = await manager.save(StockAdjustment, {
        ...dto,
        createdById: authUser.id,
        createdAt: new Date(),
      });

      await this.applyStockUpdate(stockAdjustment, manager);
      const mstockAdjustment = this.setStockMouvementParameters(
        stockAdjustment,
        reason,
      );

      await this.applyStockMouvementUpdate(mstockAdjustment, manager);

      return stockAdjustment as any;
    });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<StockAdjustment>,
    dto: UpdateStockAdjustmentDto,
  ) {
    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });

    return result;
  }

  async readPaginatedListRecordForComposite(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const stockAdjustments = await this.readPaginatedListRecord(
      options,
      page,
      perPage,
    );
    const array: Array<object> = [];
    for (const item of stockAdjustments.data as any) {
      if (!item.hasVariant) {
        if (!item.isBundle) {
          array.push(item);
        } else {
          if (item?.bundleToStockAdjustments.length < 3) {
            array.push(item);
          }
        }
      }
    }
    return array;
  }

  async readOneRecord(options?: FindOneOptions<StockAdjustment>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    return entity;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<StockAdjustment>) {
    const entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    entity.updatedById = authUser?.id;
    entity.deletedById = authUser?.id;
    const result = await this.repository.remove(entity);

    return result;
  }

  private async getReasonById(reasonId: string): Promise<Reason> {
    return this.reasonService.readOneRecord({ where: { id: reasonId } });
  }

  private calculateAfterQuantities(
    dto: CreateStockAdjustmentDto,
    reason: Reason,
  ): void {
    for (const el of dto.productToStockAdjustments) {
      switch (reason.name) {
        case DefaultReasonTypeEnum.loss:
        case DefaultReasonTypeEnum.damage:
          if (el.inStock < el.quantity || el.inStock == 0) {
            throw new BadRequestException(['Impossible de reduit le stock']);
          }
          el.afterQuantity = el.inStock - el.quantity;
          break;
        case DefaultReasonTypeEnum.receiveItem:
          el.afterQuantity = el.inStock + el.quantity;
          break;
        case DefaultReasonTypeEnum.inventoryCount:
          el.afterQuantity = el.quantity;
          break;
        default:
          throw new BadRequestException(['Invalid reason type']);
      }
    }
  }

  private setStockMouvementParameters(
    stockAdjustment: any,
    reasons: any,
  ): any[] {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    const adjustedMovements = stockAdjustment.productToStockAdjustments.map(
      (eel) => {
        const el = {
          ...eel,
          source: '',
          reason: '',
          type: '',
          destinationBranchId: '',
          reference: '',
          sourceId: '',
          createdById: '',
        };
        const reason = reasons?.name;

        switch (reason) {
          case DefaultReasonTypeEnum.loss:
            el.quantity = -Math.abs(el.quantity);
            el.source = StockMovementSourceEnum.stockAdjustement;
            el.reason = ReasonTypeEnum.ajustementLoss;
            el.type = StockMovementTypeEnum.output;
            el.destinationBranchId = stockAdjustment.branchId;
            el.reference = stockAdjustment.reference;
            el.sourceId = stockAdjustment.id;
            el.createdById = authUser?.id;
            break;
            break;

          case DefaultReasonTypeEnum.damage:
            el.quantity = -Math.abs(el.quantity);
            el.source = StockMovementSourceEnum.stockAdjustement;
            el.reason = ReasonTypeEnum.ajustementDamage;
            el.type = StockMovementTypeEnum.output;
            el.destinationBranchId = stockAdjustment.branchId;
            el.reference = stockAdjustment.reference;
            el.sourceId = stockAdjustment.id;
            el.createdById = authUser?.id;
            break;

          case DefaultReasonTypeEnum.receiveItem:
            el.quantity = Math.abs(el.quantity);
            el.source = StockMovementSourceEnum.stockAdjustement;
            el.reason = ReasonTypeEnum.ajustementReceiveItem;
            el.type = StockMovementTypeEnum.input;
            el.destinationBranchId = stockAdjustment.branchId;
            el.reference = stockAdjustment.reference;
            el.sourceId = stockAdjustment.id;
            el.createdById = authUser?.id;
            break;
            break;

          case DefaultReasonTypeEnum.inventoryCount:
            el.quantity = Math.abs(el.quantity) - Math.abs(el.inStock);
            el.type =
              el.inStock > el.quantity
                ? StockMovementTypeEnum.output
                : StockMovementTypeEnum.input;
            el.source = StockMovementSourceEnum.stockAdjustement;
            el.reason = ReasonTypeEnum.ajustementInventoryCount;
            el.destinationBranchId = stockAdjustment.branchId;
            el.reference = stockAdjustment.reference;
            el.sourceId = stockAdjustment.id;
            el.createdById = authUser?.id;
            break;

          default:
            // Si aucun type ne matche, tu peux log ou lever une erreur si nécessaire
            break;
        }

        return el;
      },
    );

    return adjustedMovements;
  }

  async myreadPaginatedListRecord(
    options?: FindManyOptions<StockAdjustment>,
    page: number = 1,
    perPage: number = 25,
  ) {
    return await this.readPaginatedListRecord(options);
  }

  async getFilterByAuthUserBranch(): Promise<
    FindOptionsWhere<StockAdjustment>
  > {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  private async updateVariantStock(
    ps: any, // ProductToStockAdjustment,
    prd: Product,
    branchId: string,
    manager?: any,
  ): Promise<void> {
    const vp = prd.variantToProducts.find((el) => el.sku == ps.sku);
    if (vp) {
      if (manager) {
        await manager
          .getRepository(this.branchVariantToProductService.entity)
          .update(
            {
              variantId: vp.id,
              branchId: branchId,
            },
            { price: ps.cost, inStock: ps.afterQuantity },
          );
      } else {
        await this.branchVariantToProductService.updateRecord(
          {
            variantId: vp.id,
            branchId: branchId,
          },
          { price: ps.cost, inStock: ps.afterQuantity },
        );
      }
    }
  }

  private async updateProductStock(
    ps: any, //ProductToStockAdjustment,
    branchId: string,
    manager?: any,
  ): Promise<void> {
    if (manager) {
      await manager.getRepository(this.branchToProductService.entity).update(
        {
          productId: ps.productId,
          branchId: branchId,
        },
        { price: ps.cost, inStock: ps.afterQuantity },
      );
    } else {
      await this.branchToProductService.updateRecord(
        {
          productId: ps.productId,
          branchId: branchId,
        },
        { price: ps.cost, inStock: ps.afterQuantity },
      );
    }
  }

  private async applyStockUpdate(dto: any, manager?: any) {
    for (const ps of dto.productToStockAdjustments) {
      const prd = await this.productService.getDetails(ps.productId);

      if (prd.hasVariant) {
        await this.updateVariantStock(ps, prd, dto.branchId, manager);
      } else {
        await this.updateProductStock(ps, dto.branchId, manager);
      }
    }
  }

  private async applyStockMouvementUpdate(
    stockAdjustmentProductData: any,
    manager?: any,
  ) {
    for (const el of stockAdjustmentProductData) {
      await this.updateStockMovements(el, manager);
    }
  }

  async updateStockMovements(
    stockAdjustmentProductData: any,
    manager?: any,
  ): Promise<void> {
    if (manager) {
      await manager.getRepository(this.stockMovementService.entity).save({
        productId: stockAdjustmentProductData.productId,
        quantity: stockAdjustmentProductData.quantity,
        type: stockAdjustmentProductData.type,
        source: stockAdjustmentProductData.source,
        branchId: stockAdjustmentProductData.destinationBranchId,
        sku: stockAdjustmentProductData.sku,
        reference: stockAdjustmentProductData.reference,
        sourceId: stockAdjustmentProductData.sourceId,
        cost: stockAdjustmentProductData.cost,
        reason: stockAdjustmentProductData.reason,
        isManual: true,
        totalCost:
          stockAdjustmentProductData.quantity * stockAdjustmentProductData.cost,
        createdById: stockAdjustmentProductData.createdById,
      });
    } else {
      // Journaliser le mouvement
      await this.stockMovementService.createRecord({
        productId: stockAdjustmentProductData.productId,
        quantity: stockAdjustmentProductData.quantity,
        type: stockAdjustmentProductData.type,
        source: stockAdjustmentProductData.sources,
        branchId: stockAdjustmentProductData.destinationBranchId,
        sku: stockAdjustmentProductData.sku,
        reference: stockAdjustmentProductData.reference,
        sourceId: stockAdjustmentProductData.sourceId,
        cost: stockAdjustmentProductData.cost,
        reason: stockAdjustmentProductData.reason,
        isManual: true,
        totalCost:
          stockAdjustmentProductData.quantity * stockAdjustmentProductData.cost,
        //createdById: stockAdjustmentProductData.createdById,
      });
    }
  }

  async getReceptionWithRelations(options: any) {
    return await this.readOneRecord({
      relations: {
        reason: true,
        productToStockAdjustments: { product: true },
      },
      where: { id: options.id, branchId: options.branchId },
    });
  }
}
