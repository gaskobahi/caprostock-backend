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
import { DefaultReasonTypeEnum } from 'src/core/definitions/enums';
import { ProductService } from '../product/product.service';

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

  async createRecord(dto: CreateStockAdjustmentDto): Promise<StockAdjustment> {
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

  /* async getFilterByAuthUserBranch(): Promise<
    FindOptionsWhere<StockAdjustment>
  > {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchToStockAdjustments: {
          branchId: authUser.targetBranchId,
        },
      };
    }

    return {};
  }*/

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
}
