import { PaginatedService } from '@app/typeorm';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
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
import {
  DefaultTransferOrderTypeEnum,
  ReasonTypeEnum,
  StockMovementSourceEnum,
  StockMovementTypeEnum,
} from 'src/core/definitions/enums';
import { ProductService } from '../product/product.service';
import { RunInTransactionService } from '../transaction/runInTransaction.service';
import { StockMovementService } from '../stockMovement/stockMovement.service';
import { ProductToTransfertOrder } from 'src/core/entities/stockmanagement/product-to-transfertorder.entity';

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
    private readonly runInTransactionService: RunInTransactionService,
    private readonly stockMovementService: StockMovementService,

    protected paginatedService: PaginatedService<TransfertOrder>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<TransfertOrder> {
    return this._repository;
  }

  async myreadPaginatedListRecord(
    options?: FindManyOptions<TransfertOrder>,
    page: number = 1,
    perPage: number = 25,
  ) {
    // Paginate using provided options, page, and perPage
    const response = await this.readPaginatedListRecord(options);

    // Update response data with processed items and return
    return response;
  }

  async createRecord(dto: CreateTransfertOrderDto): Promise<TransfertOrder> {
    if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
      dto.status = DefaultTransferOrderTypeEnum.transfered;
    }
    //verifier si la surccusale source est differente de la surcussale destinatiion
    this.validateDistinctBranches(dto);
    //verifier le stock du produit source et product destination
    //this.validateSourcesBrancchInstock(dto);
    await this.ckeckStock(dto);

    return await this.runInTransactionService.runInTransaction(
      async (manager) => {
        const transfertOrder = await manager.save(TransfertOrder, dto);
        // const result = await super.createRecord({ ...dto });

        if (transfertOrder) {
          if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
            //update product stock
            await this.handleTransferCompletion(dto as any, manager);
          }
        }
        return transfertOrder;
      },
    );
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<TransfertOrder>,
    dto: UpdateTransfertOrderDto,
  ): Promise<any> {
    if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
      dto.status = DefaultTransferOrderTypeEnum.transfered;
    }

    return await this.runInTransactionService.runInTransaction(
      async (manager) => {
        const { productToTransfertOrders, ...restDto } = dto;
        const toUpdate = await manager.preload(TransfertOrder, {
          id: optionsWhere.id as string,
          ...restDto,
        });

        if (!toUpdate) {
          throw new NotFoundException(['TransfertOrder introuvable']);
        }

        if (
          !productToTransfertOrders ||
          productToTransfertOrders.length === 0
        ) {
          throw new BadRequestException('Aucun produit à transférer');
        }
        const updatedTransfertOrder = await manager.save(toUpdate);

        if (updatedTransfertOrder?.id) {
          await manager.delete(ProductToTransfertOrder, {
            transfertOrderId: updatedTransfertOrder.id,
          });

          for (const prod of productToTransfertOrders) {
            await manager.save(ProductToTransfertOrder, {
              ...prod,
              transfertOrderId: updatedTransfertOrder.id,
            });
          }
        }

        if (updatedTransfertOrder) {
          if (dto.action == DefaultTransferOrderTypeEnum.transfered) {
            await this.handleTransferCompletion(dto, manager);
          }
        }
        return updatedTransfertOrder;
      },
    );
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
                  parseInt(srcbranchVariants?.inStock.toString()) -
                  parseInt(quantity.toString()),
                dstInStock:
                  parseInt(dstbranchVariants?.inStock.toString()) +
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
                parseInt(srcbranchProducts?.inStock.toString()) -
                parseInt(quantity.toString()),
              dstInStock:
                parseInt(dstbranchProducts?.inStock.toString()) +
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

  /*async updateStock(dto: CreateTransfertOrderDto) {
    for (const ps of dto.productToTransfertOrders) {
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
  }*/

  private async updateStock(dto: any, manager?: any): Promise<void> {
    for (const ps of dto.productToTransfertOrders) {
      const prd = await this.productService.getDetails(ps.productId);
      if (prd.hasVariant) {
        await this.updateVariantStock(prd.variantToProducts, ps, dto, manager);
      } else {
        await this.updateProductStock(prd.branchToProducts, ps, dto, manager);
      }
    }
  }

  private async updateVariantStock(
    variants,
    ps,
    dto,
    manager?: any,
  ): Promise<void> {
    const vp = variants.find((el) => el.sku === ps.sku);

    if (!vp) return;

    const srcProductBranch = vp.branchVariantToProducts.find(
      (el) => el.branchId === dto.sourceBranchId && el.sku === vp.sku,
    );
    const dstProductBranch = vp.branchVariantToProducts.find(
      (el) => el.branchId === dto.destinationBranchId && el.sku === vp.sku,
    );

    if (srcProductBranch && dstProductBranch) {
      if (manager) {
        await manager
          .getRepository(this.branchVariantToProductService.entity)
          .update(
            { sku: vp.sku, branchId: dto.sourceBranchId },
            { inStock: srcProductBranch.inStock - ps.quantity },
          );
        await manager
          .getRepository(this.branchVariantToProductService.entity)
          .update(
            { sku: vp.sku, branchId: dto.destinationBranchId },
            { inStock: dstProductBranch.inStock + ps.quantity },
          );
      } else {
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
  }

  private async updateProductStock(
    branchToProducts,
    ps,
    dto,
    manager?: any,
  ): Promise<void> {
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
      if (manager) {
        await manager
          .getRepository(this.branchToProductService.entity)
          .update(
            { productId: ps.productId, branchId: dto.sourceBranchId },
            { inStock: srcProductBranch.inStock - ps.quantity },
          );
        await manager
          .getRepository(this.branchToProductService.entity)
          .update(
            { productId: ps.productId, branchId: dto.destinationBranchId },
            { inStock: dstProductBranch.inStock + ps.quantity },
          );
      } else {
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

  private validateDistinctBranches(dto: CreateTransfertOrderDto): void {
    if (dto.sourceBranchId === dto.destinationBranchId) {
      throw new BadRequestException([
        `La succursale source et destination doivent être différentes.`,
      ]);
    }
  }
  private async applyStockMouvementUpdate(transfertOrder: any, manager?: any) {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    const { productToTransfertOrders } = transfertOrder;
    for (const productTotransfertOrder of productToTransfertOrders) {
      let produit: any;

      const prd = await this.productService.getDetails(
        productTotransfertOrder.productId,
      );
      if (!prd) {
        throw new NotFoundException('Produit introuvable');
      }
      if (prd.hasVariant) {
        const variant = prd?.variantToProducts.find(
          (v) => v.sku === productTotransfertOrder.sku,
        );
        produit = variant.branchVariantToProducts.find(
          (bv) =>
            bv.sku === productTotransfertOrder.sku &&
            bv.branchId === transfertOrder.sourceBranchId,
        );
      } else {
        produit = prd?.branchToProducts.find(
          (v) =>
            v.productId === productTotransfertOrder.productId &&
            v.branchId == transfertOrder.sourceBranchId,
        );
      }

      const productTotransfertOrdersData = {
        ...productTotransfertOrder,
        sourceBranchId: transfertOrder.sourceBranchId,
        destinationBranchId: transfertOrder.destinationBranchId,
        reference: transfertOrder.reference,
        sourceId: transfertOrder.id,
        createdById: authUser?.id,
        cost: produit.price,
      };
      await this.updateStockMovements(productTotransfertOrdersData, manager);
    }
  }

  async updateStockMovements(
    transfertOrderProductData: any,
    manager?: any,
  ): Promise<void> {
    if (manager) {
      await manager.getRepository(this.stockMovementService.entity).save({
        productId: transfertOrderProductData.productId,
        quantity: -transfertOrderProductData.quantity,
        type: StockMovementTypeEnum.output,
        source: StockMovementSourceEnum.transfertOrder,
        branchId: transfertOrderProductData.sourceBranchId,
        sku: transfertOrderProductData.sku,
        reference: transfertOrderProductData.reference,
        sourceId: transfertOrderProductData.sourceId,
        cost: transfertOrderProductData.cost,
        reason: ReasonTypeEnum.transfertOrder,
        isManual: true,
        totalCost:
          -transfertOrderProductData.quantity * transfertOrderProductData.cost,
        createdById: transfertOrderProductData.createdById,
      });
      await manager.getRepository(this.stockMovementService.entity).save({
        productId: transfertOrderProductData.productId,
        quantity: transfertOrderProductData.quantity,
        type: StockMovementTypeEnum.input,
        source: StockMovementSourceEnum.transfertOrder,
        branchId: transfertOrderProductData.destinationBranchId,
        sku: transfertOrderProductData.sku,
        reference: transfertOrderProductData.reference,
        sourceId: transfertOrderProductData.sourceId,
        cost: transfertOrderProductData.cost,
        reason: ReasonTypeEnum.transfertOrder,
        isManual: true,
        totalCost:
          transfertOrderProductData.quantity * transfertOrderProductData.cost,
        createdById: transfertOrderProductData.createdById,
      });
    } else {
      // Journaliser le mouvement
      await this.stockMovementService.createRecord({
        productId: transfertOrderProductData.productId,
        quantity: -transfertOrderProductData.quantity,
        type: StockMovementTypeEnum.output,
        source: StockMovementSourceEnum.transfertOrder,
        branchId: transfertOrderProductData.sourceBranchId,
        sku: transfertOrderProductData.sku,
        reference: transfertOrderProductData.reference,
        sourceId: transfertOrderProductData.sourceId,
        cost: transfertOrderProductData.cost,
        reason: ReasonTypeEnum.transfertOrder,
        isManual: true,
        totalCost:
          -transfertOrderProductData.quantity * transfertOrderProductData.cost,
        //createdById: transfertOrderProductData.createdById,
      });
      await this.stockMovementService.createRecord({
        productId: transfertOrderProductData.productId,
        quantity: transfertOrderProductData.quantity,
        type: StockMovementTypeEnum.input,
        source: StockMovementSourceEnum.transfertOrder,
        branchId: transfertOrderProductData.destinationBranchId,
        sku: transfertOrderProductData.sku,
        reference: transfertOrderProductData.reference,
        sourceId: transfertOrderProductData.sourceId,
        cost: transfertOrderProductData.cost,
        reason: ReasonTypeEnum.transfertOrder,
        isManual: true,
        totalCost:
          transfertOrderProductData.quantity * transfertOrderProductData.cost,
        //createdById: transfertOrderProductData.createdById,
      });
    }
  }
  private validateSourcesBrancchInstock(dto: CreateTransfertOrderDto): void {
    for (const item of dto.productToTransfertOrders) {
      if (item.srcInStock <= 0 || item.srcInStock < item.quantity) {
        throw new BadRequestException([
          `Le stock source doit être supérieur au stock de destination pour le produit ${item.sku}`,
        ]);
      }
    }
  }

  private async ckeckStock(dto: any) {
    // Étape 1 : Vérification préalable du stock source
    for (const ps of dto.productToTransfertOrders) {
      const prd = await this.productService.getDetails(ps.productId);

      if (prd.hasVariant) {
        const variant = prd?.variantToProducts.find((v) => v.sku === ps.sku);
        const srcStock =
          variant.branchVariantToProducts.find(
            (b) => b.branchId === dto.sourceBranchId && b.sku === variant.sku,
          )?.inStock ?? 0;

        if (srcStock < ps.quantity) {
          throw new BadRequestException([
            `Stock insuffisant pour la variante ${variant.name}-${variant.sku} (disponible: ${srcStock}, requis: ${ps.quantity})`,
          ]);
        }
      } else {
        const srcStock =
          prd.branchToProducts.find(
            (v) =>
              v.productId === ps.productId && v.branchId === dto.sourceBranchId,
          )?.inStock ?? 0;
        //if (branchProduct.branchId === dto.sourceBranchId) {
        // const srcStock = branchProduct.inStock ?? 0;

        if (srcStock < ps.quantity) {
          throw new BadRequestException([
            `Stock insuffisant pour le produit ${prd.displayName}-${prd.sku}  (disponible: ${srcStock}, requis: ${ps.quantity})`,
          ]);
          //}
        }
      }
    }
  }

  private async handleTransferCompletion(
    dto: UpdateTransfertOrderDto,
    manager: EntityManager,
  ) {
    await this.ckeckStock(dto);
    await this.updateStock(dto, manager);
    await this.applyStockMouvementUpdate(dto, manager);
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<TransfertOrder>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        sourceBranchId: authUser.targetBranchId,
      };
    }

    return {};
  }
}
