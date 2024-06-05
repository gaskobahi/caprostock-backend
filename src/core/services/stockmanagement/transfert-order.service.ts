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
import { TransfertOrder } from 'src/core/entities/stockmanagement/transfertorder.entity';
import { CreateTransfertOrderDto } from 'src/core/dto/stockmanagement/create-transfert-order.dto';
import { UpdateTransfertOrderDto } from 'src/core/dto/stockmanagement/update-transfert-order.dto';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { ReasonService } from './reason.service';
import { DefaultTransferOrderTypeEnum } from 'src/core/definitions/enums';
import { ProductService } from '../product/product.service';

@Injectable()
export class TransfertOrderService extends AbstractService<TransfertOrder> {
  public NOT_FOUND_MESSAGE = `Ajustement de stock non trouvé`;

  constructor(
    @InjectRepository(TransfertOrder)
    private _repository: Repository<TransfertOrder>,
    private readonly configService: ConfigService,
    private readonly branchToProductService: BranchToProductService,
    private readonly branchVariantToProductService: BranchVariantToProductService,
    private readonly productService: ProductService,

    protected paginatedService: PaginatedService<TransfertOrder>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<TransfertOrder> {
    return this._repository;
  }

  async readPaginatedListRecord(
    options?: FindManyOptions<TransfertOrder>,
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

  async createRecord(dto: CreateTransfertOrderDto): Promise<TransfertOrder> {
    if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
      dto.status = DefaultTransferOrderTypeEnum.transfered;
    }
    const result = await super.createRecord({ ...dto });

    if (result) {
      if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
        //update product stock
        await this.handleProductTransfers(dto);
      }
    }
    return result;
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<TransfertOrder>,
    dto: UpdateTransfertOrderDto,
  ) {
    if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
      dto.status = DefaultTransferOrderTypeEnum.transfered;
    }
    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });
    if (result) {
      if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
        await this.handleProductTransfers(dto);
      }
    }
    return result;
  }

  /* async getFilterByAuthUserBranch(): Promise<
    FindOptionsWhere<TransfertOrder>
  > {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchToTransfertOrders: {
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
    const transfertOrders = await this.readPaginatedListRecord(
      options,
      page,
      perPage,
    );
    const array: Array<object> = [];
    for (const item of transfertOrders.data as any) {
      if (!item.hasVariant) {
        if (!item.isBundle) {
          array.push(item);
        } else {
          if (item?.bundleToTransfertOrders.length < 3) {
            array.push(item);
          }
        }
      }
    }
    return array;
  }

  async readOneRecord(options?: FindOneOptions<TransfertOrder>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const { sourceBranchId, destinationBranchId } = entity;

    const productToTransfertOrders = entity?.productToTransfertOrders?.reduce(
      (acc, { productId, quantity, product: item, sku }) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts?.filter((v) => v.sku === sku);

          variants?.forEach((vp) => {
            const srcbranchVariants = vp.branchVariantToProducts.find(
              (bvp) => bvp.branchId === sourceBranchId,
            );
            const dstbranchVariants = vp.branchVariantToProducts.find(
              (bvp) => bvp.branchId === destinationBranchId,
            );
            if (srcbranchVariants) {
              acc.push({
                productId: productId,
                quantity: quantity,
                srcInStock:
                  parseInt(srcbranchVariants.inStock.toString()) -
                  parseInt(quantity.toString()),
                dstInStock:
                  parseInt(dstbranchVariants.inStock.toString()) +
                  parseInt(quantity.toString()),
                variantId: vp.id,
                hasVariant: item.hasVariant,
                displayName: `${item.displayName} (${vp.name})`,
                sku: sku,
              });
            }
          });
        } else {
          const srcbranchProducts = item.branchToProducts.find(
            (bp) => bp.branchId === sourceBranchId,
          );
          const dstbranchProducts = item.branchToProducts.find(
            (bp) => bp.branchId === destinationBranchId,
          );
          if (srcbranchProducts) {
            acc.push({
              productId: productId,
              quantity: quantity,
              hasVariant: item.hasVariant,
              srcInStock:
                parseInt(srcbranchProducts.inStock.toString()) -
                parseInt(quantity.toString()),
              dstInStock:
                parseInt(dstbranchProducts.inStock.toString()) +
                parseInt(quantity.toString()),
              displayName: `${item.displayName}`,
              sku: sku,
              variantId: null,
            });
          }
        }
        return acc;
      },
      [],
    );
    entity.productToTransfertOrders = productToTransfertOrders;
    return entity;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<TransfertOrder>) {
    const entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    if (entity.status == DefaultTransferOrderTypeEnum.transfered) {
      throw new BadRequestException(
        `L'ordre de transfert ayant le statut ${DefaultTransferOrderTypeEnum.transfered} est impossible`,
      );
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    entity.updatedById = authUser?.id;
    entity.deletedById = authUser?.id;
    const result = await this.repository.remove(entity);

    return result;
  }

  async updateStock(dto: CreateTransfertOrderDto) {
    for (const ps of dto.productToTransfertOrders) {
      //find product by Id
      /*const prd = await this.productService.readOneRecord({
        relations: {
          variantToProducts: { branchVariantToProducts: true },
          branchToProducts: true,
        },
        where: { id: ps.productId },
      });*/
      const prd = await this.productService.getDetails(ps.productId);

      if (prd.hasVariant) {
        const variants = prd?.variantToProducts;
        if (variants) {
          const vp = variants.find((el) => el.sku == ps.sku);
          const srcProductBranchs = vp?.branchVariantToProducts.find(
            (el) => el.branchId == dto.sourceBranchId && el.sku == vp.sku,
          );
          const dstProductBranchs = vp?.branchVariantToProducts.find(
            (el) => el.branchId == dto.destinationBranchId && el.sku == vp.sku,
          );
          await this.branchVariantToProductService.updateRecord(
            {
              sku: vp.sku,
              branchId: dto.sourceBranchId,
            },
            { inStock: srcProductBranchs.inStock - ps.quantity },
          );
          await this.branchVariantToProductService.updateRecord(
            {
              sku: vp.sku,
              branchId: dto.destinationBranchId,
            },
            { inStock: dstProductBranchs.inStock + ps.quantity },
          );
        }
      } else {
        const srcProductBranchs = prd?.branchToProducts.find(
          (el) => (
            el.productId == ps.productId, el.branchId == dto.sourceBranchId
          ),
        );
        const dstProductBranchs = prd?.branchToProducts.find(
          (el) => (
            el.productId == ps.productId, el.branchId == dto.destinationBranchId
          ),
        );
        await this.branchToProductService.updateRecord(
          {
            productId: ps.productId,
            branchId: dto.sourceBranchId,
          },
          { inStock: srcProductBranchs.inStock - ps.quantity },
        );
        await this.branchToProductService.updateRecord(
          {
            productId: ps.productId,
            branchId: dto.destinationBranchId,
          },
          { inStock: dstProductBranchs.inStock + ps.quantity },
        );
      }
    }
  }

  private async handleProductTransfers(dto: any): Promise<void> {
    for (const ps of dto.productToTransfertOrders) {
      /*const prd = await this.productService.readOneRecord({
        relations: {
          variantToProducts: { branchVariantToProducts: true },
          branchToProducts: true,
        },
        where: { id: ps.productId },
      });*/
      const prd = await this.productService.getDetails(ps.productId);

      if (prd.hasVariant) {
        await this.updateVariantStock(prd.variantToProducts, ps, dto);
      } else {
        await this.updateProductStock(prd.branchToProducts, ps, dto);
      }
    }
  }

  private async updateVariantStock(variants, ps, dto): Promise<void> {
    const vp = variants.find((el) => el.sku === ps.sku);

    if (!vp) return;

    const srcProductBranch = vp.branchVariantToProducts.find(
      (el) => el.branchId === dto.sourceBranchId && el.sku === vp.sku,
    );
    const dstProductBranch = vp.branchVariantToProducts.find(
      (el) => el.branchId === dto.destinationBranchId && el.sku === vp.sku,
    );

    if (srcProductBranch && dstProductBranch) {
      await this.branchVariantToProductService.updateRecord(
        { sku: vp.sku, branchId: dto.sourceBranchId },
        { inStock: srcProductBranch.inStock - ps.quantity },
      );
      await this.branchVariantToProductService.updateRecord(
        { sku: vp.sku, branchId: dto.destinationBranchId },
        { inStock: dstProductBranch.inStock + ps.quantity },
      );
    }
  }

  private async updateProductStock(branchToProducts, ps, dto): Promise<void> {
    const srcProductBranch = branchToProducts.find(
      (el) =>
        el.productId === ps.productId && el.branchId === dto.sourceBranchId,
    );
    const dstProductBranch = branchToProducts.find(
      (el) =>
        el.productId === ps.productId &&
        el.branchId === dto.destinationBranchId,
    );

    if (srcProductBranch && dstProductBranch) {
      await this.branchToProductService.updateRecord(
        { productId: ps.productId, branchId: dto.sourceBranchId },
        { inStock: srcProductBranch.inStock - ps.quantity },
      );
      await this.branchToProductService.updateRecord(
        { productId: ps.productId, branchId: dto.destinationBranchId },
        { inStock: dstProductBranch.inStock + ps.quantity },
      );
    }
  }
}
