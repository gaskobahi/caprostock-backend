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
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { AbstractService } from '../abstract.service';
import { ConfigService } from '../system/config.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { InventoryCount } from 'src/core/entities/stockmanagement/inventorycount.entity';
import { CreateInventoryCountDto } from 'src/core/dto/stockmanagement/create-inventory-count.dto';
import { UpdateInventoryCountDto } from 'src/core/dto/stockmanagement/update-inventory-count.dto';
import {
  InventoryCountStatusEnum,
  InventoryCountTypeEnum,
  ReasonTypeEnum,
  StockMovementSourceEnum,
  StockMovementTypeEnum,
} from 'src/core/definitions/enums';
import { ProductService } from '../product/product.service';
import { UpdateInventoryCountSaveDto } from 'src/core/dto/stockmanagement/update-inventory-count-save.dto';
import { RunInTransactionService } from '../transaction/runInTransaction.service';
import { StockMovementService } from '../stockMovement/stockMovement.service';
import { ProductToInventoryCount } from 'src/core/entities/stockmanagement/product-to-inventoryCount.entity';

@Injectable()
export class InventoryCountService extends AbstractService<InventoryCount> {
  public NOT_FOUND_MESSAGE = `Inventaire de stock non trouvé`;

  constructor(
    @InjectRepository(InventoryCount)
    private _repository: Repository<InventoryCount>,
    private readonly configService: ConfigService,
    private readonly branchToProductService: BranchToProductService,
    private readonly branchVariantToProductService: BranchVariantToProductService,
    private readonly productService: ProductService,
    private readonly runInTransactionService: RunInTransactionService,
    private readonly stockMovementService: StockMovementService,

    protected paginatedService: PaginatedService<InventoryCount>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<InventoryCount> {
    return this._repository;
  }

  async myreadPaginatedListRecord(
    options?: FindManyOptions<InventoryCount>,
    page: number = 1,
    perPage: number = 25,
  ) {
    return await this.readPaginatedListRecord(options);
  }
  /*async readPaginatedListRecord(
    options?: FindManyOptions<InventoryCount>,
    page: number = 1,
    perPage: number = 25,
  ) {
    console.log('sdsdsdsdsdsds4',options)
    console.log('sdsdsdsdsdsds5',page)
    console.log('sdsdsdsdsdsds6',page)

    // Paginate using provided options, page, and perPage
    const response = await this.paginatedService.paginate(
      this.repository,
      page,
      perPage,
      options,
    );

    // Update response data with processed items and return
    return response;
  }*/

  async createRecord(dto: CreateInventoryCountDto): Promise<InventoryCount> {
    if (dto.type == InventoryCountTypeEnum.partial) {
      if (
        !dto.productToInventoryCounts ||
        dto.productToInventoryCounts.length == 0
      ) {
        throw new BadRequestException([
          'productToInventoryCounts ne peux pas être vide pour le type partial',
        ]);
      }
    } else {
      const options = {
        relations: {
          branchToProducts: true,
          bundleToProducts: { bundle: true, product: true },
          variantToProducts: { branchVariantToProducts: true },
          options: true,
        },
      };
      const productToInventoryCounts =
        await this.productService.readPaginatedListRecordForInventoryCount(
          options,
          1,
          10000,
        );
      const myproductToInventoryCounts = this.generateFormatInventoryCounts(
        productToInventoryCounts,
        dto.branchId,
      );
      dto.productToInventoryCounts = myproductToInventoryCounts;
      if (
        !dto?.productToInventoryCounts ||
        dto?.productToInventoryCounts.length == 0
      ) {
        throw new BadRequestException([
          `Aucun produit respectant les criteres de l'inventaire de stock trouvé`,
        ]);
      }
    }
    dto.productToInventoryCounts.forEach((dt) => {
      dt.isBelong = true;
    });
    return await super.createRecord({ ...dto });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<InventoryCount>,
    dto: UpdateInventoryCountDto,
  ) {
    if (dto.type == InventoryCountTypeEnum.partial) {
      if (
        !dto.productToInventoryCounts ||
        dto.productToInventoryCounts.length == 0
      ) {
        throw new BadRequestException(
          'productToInventoryCounts ne peux pas être vide pour le type partial',
        );
      }
    } else {
      const options = {
        relations: {
          branchToProducts: true,
          bundleToProducts: true,
          variantToProducts: { branchVariantToProducts: true },
          options: true,
        },
      };
      const productToInventoryCounts =
        await this.productService.readPaginatedListRecordForInventoryCount(
          options,
          1,
          10000,
        );
      const myproductToInventoryCounts = this.generateFormatInventoryCounts(
        productToInventoryCounts,
        dto.branchId,
      );
      dto.productToInventoryCounts = myproductToInventoryCounts;
      if (
        !dto?.productToInventoryCounts ||
        dto?.productToInventoryCounts.length == 0
      ) {
        throw new BadRequestException(
          `Aucun produit respectant les criteres de l'inventaire de stock trouvé`,
        );
      }
    }
    dto.productToInventoryCounts.forEach((dt) => {
      dt.isBelong = true;
    });
    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });
    return result;
  }

  /*async updateRecordCountSave(
    optionsWhere: FindOptionsWhere<any>,
    dto: UpdateInventoryCountSaveDto,
  ): Promise<InventoryCount> {
    const previousIC = await this.repository.findOneBy(optionsWhere);

    if (previousIC.status == InventoryCountStatusEnum.completed) {
      throw new BadRequestException(
        'Impossible de modifier le statut déjà complété',
      );
    }

    if (dto.action === InventoryCountStatusEnum.inProgress) {
      dto.status = InventoryCountStatusEnum.inProgress;
    }
    if (dto.action === InventoryCountStatusEnum.completed) {
      dto.status = InventoryCountStatusEnum.completed;
    }

    dto.productToInventoryCounts = dto.productToInventoryCounts
      .filter((dt) => dt.difference != 0)
      .map((dt) => ({ ...dt }));

    if (!dto.productToInventoryCounts.length) {
      throw new NotFoundException(['Rien à modifier']);
    }

    return await this.runInTransactionService.runInTransaction(
      async (manager) => {
        const { productToInventoryCounts, ...restDto } = dto;
        const toUpdate = await manager.preload(InventoryCount, {
          id: optionsWhere.id as string,
          ...restDto,
        });

        if (!toUpdate) {
          throw new NotFoundException('InventoryCount introuvable');
        }

        const updatedInventoryCount = await manager.save(toUpdate);

        if (updatedInventoryCount?.id) {
          await manager.delete(ProductToInventoryCount, {
            inventoryCountId: updatedInventoryCount.id,
          });

          for (const prod of productToInventoryCounts) {
            await manager.save(ProductToInventoryCount, {
              ...prod,
              inventoryCountId: updatedInventoryCount.id,
            });
          }
        }

        if (dto.action === InventoryCountStatusEnum.completed) {
          const ddto = {
            ...dto,
            sourceId: updatedInventoryCount.id,
            reference: updatedInventoryCount.reference,
          };
          await this.applyStockUpdate(dto, manager);
          await this.applyStockMouvementUpdate(ddto, manager);
        }

        return updatedInventoryCount;
      },
    );
  }*/

  async updateRecordCountSave(
    optionsWhere: FindOptionsWhere<any>,
    dto: UpdateInventoryCountSaveDto,
  ): Promise<InventoryCount> {
    const previousIC = await this.repository.findOneBy(optionsWhere);

    if (previousIC.status === InventoryCountStatusEnum.completed) {
      throw new BadRequestException([
        'Impossible de modifier le statut déjà complété',
      ]);
    }

    if (dto.action === InventoryCountStatusEnum.inProgress) {
      dto.status = InventoryCountStatusEnum.inProgress;
    } else if (dto.action === InventoryCountStatusEnum.completed) {
      dto.status = InventoryCountStatusEnum.completed;
    }

    dto.productToInventoryCounts = dto.productToInventoryCounts
      .filter((dt) => dt.difference !== 0)
      .map((dt) => ({ ...dt }));

    if (
      !dto.productToInventoryCounts ||
      dto.productToInventoryCounts.length === 0
    ) {
      throw new BadRequestException(['Aucun produit à compter fourni']);
    }

    return await this.runInTransactionService.runInTransaction(
      async (manager) => {
        const { productToInventoryCounts, ...restDto } = dto;
        const toUpdate = await manager.preload(InventoryCount, {
          id: optionsWhere.id as string,
          ...restDto,
        });

        if (!toUpdate) {
          throw new NotFoundException(['InventoryCount introuvable']);
        }

        const updatedInventoryCount = await manager.save(toUpdate);

        if (updatedInventoryCount?.id) {
          await manager.delete(ProductToInventoryCount, {
            inventoryCountId: updatedInventoryCount.id,
          });

          for (const prod of productToInventoryCounts) {
            await manager.save(ProductToInventoryCount, {
              ...prod,
              inventoryCountId: updatedInventoryCount.id,
            });
          }
        }

        if (dto.action === InventoryCountStatusEnum.completed) {
          const stockDto = {
            ...dto,
            sourceId: updatedInventoryCount.id,
            reference: updatedInventoryCount.reference,
          };
          await this.applyStockUpdate(dto, manager);
          await this.applyStockMouvementUpdate(stockDto, manager);
        }

        return updatedInventoryCount;
      },
    );
  }
  private async applyStockUpdate(dto: any, manager?: any) {
    for (const pi of dto.productToInventoryCounts) {
      const prd = await this.productService.getDetails(pi.productId);
      if (pi.counted > 0) {
        if (prd.hasVariant) {
          if (manager) {
            const vp = prd.variantToProducts.find((el) => el.sku == pi.sku);
            await manager
              .getRepository(this.branchVariantToProductService.entity)
              .update(
                {
                  variantId: vp.id,
                  branchId: dto.branchId,
                },
                { inStock: pi.counted },
              );
          } else {
            const vp = prd.variantToProducts.find((el) => el.sku == pi.sku);

            await this.branchVariantToProductService.updateRecord(
              {
                variantId: vp.id,
                branchId: dto.branchId,
              },
              { inStock: pi.counted },
            );
          }
        } else {
          if (manager) {
            await manager
              .getRepository(this.branchToProductService.entity)
              .update(
                {
                  productId: pi.productId,
                  branchId: dto.branchId,
                },
                { inStock: pi.counted },
              );
          } else {
            //update branch for product
            await this.branchToProductService.updateRecord(
              {
                productId: pi.productId,
                branchId: dto.branchId,
              },
              { inStock: pi.counted },
            );
          }
        }
      }
    }
  }

  private async applyStockMouvementUpdate(inventoryCount: any, manager?: any) {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    for (const productToInventoryCount of inventoryCount.productToInventoryCounts) {
      const productToInventoryCountData = {
        ...productToInventoryCount,
        destinationBranchId: inventoryCount.branchId,
        reference: inventoryCount.reference,
        sourceId: inventoryCount.sourceId,
        createdById: authUser?.id,
      };
      await this.updateStockMovements(productToInventoryCountData, manager);
    }
  }

  async updateStockMovements(
    inventoryCountProductData: any,
    manager?: any,
  ): Promise<void> {
    if (manager) {
      await manager.getRepository(this.stockMovementService.entity).save({
        productId: inventoryCountProductData.productId,
        quantity: inventoryCountProductData.difference,
        type:
          inventoryCountProductData.counted > inventoryCountProductData.inStock
            ? StockMovementTypeEnum.input
            : StockMovementTypeEnum.output,
        source: StockMovementSourceEnum.inventoryCount,
        branchId: inventoryCountProductData.destinationBranchId,
        sku: inventoryCountProductData.sku,
        reference: inventoryCountProductData.reference,
        sourceId: inventoryCountProductData.sourceId,
        cost: inventoryCountProductData.cost,
        reason: ReasonTypeEnum.ajustementInventoryCount,
        isManual: true,
        totalCost:
          inventoryCountProductData.difference * inventoryCountProductData.cost,
        createdById: inventoryCountProductData.createdById,
      });
    } else {
      // Journaliser le mouvement
      await this.stockMovementService.createRecord({
        productId: inventoryCountProductData.productId,
        quantity: inventoryCountProductData.difference,
        type:
          inventoryCountProductData.counted > inventoryCountProductData.inStock
            ? StockMovementTypeEnum.input
            : StockMovementTypeEnum.output,
        source: StockMovementSourceEnum.inventoryCount,
        branchId: inventoryCountProductData.destinationBranchId,
        sku: inventoryCountProductData.sku,
        reference: inventoryCountProductData.reference,
        sourceId: inventoryCountProductData.sourceId,
        cost: inventoryCountProductData.cost,
        reason: ReasonTypeEnum.ajustementInventoryCount,
        isManual: true,
        totalCost:
          inventoryCountProductData.difference * inventoryCountProductData.cost,
      });
    }
  }
  async readPaginatedListRecordForComposite(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const inventoryCounts = await this.readPaginatedListRecord(
      options,
      page,
      perPage,
    );
    const array: Array<object> = [];
    for (const item of inventoryCounts.data as any) {
      if (!item.hasVariant) {
        if (!item.isBundle) {
          array.push(item);
        } else {
          if (item?.bundleToInventoryCounts.length < 3) {
            array.push(item);
          }
        }
      }
    }
    return array;
  }

  async readOneRecord(options?: FindOneOptions<InventoryCount>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException([this.NOT_FOUND_MESSAGE]);
    }

    const { branchId } = entity;
    const totalDifference = entity?.productToInventoryCounts?.reduce(
      (acc, { difference }) => {
        acc += difference;
        return acc;
      },
      0,
    );
    const totalDifferenceCost = entity?.productToInventoryCounts?.reduce(
      (acc, { differenceCost }) => {
        acc += differenceCost;
        return acc;
      },
      0,
    );
    const productToInventoryCounts = entity?.productToInventoryCounts?.reduce(
      (
        acc,
        {
          productId,
          inStock,
          counted,
          difference,
          differenceCost,
          isBelong,
          product: item,
          sku,
        },
      ) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts.filter((v) => v.sku === sku);
          variants.forEach((vp) => {
            const branchVariants = vp.branchVariantToProducts.find(
              (bvp) => bvp.branchId === branchId,
            );
            if (branchVariants) {
              acc.push({
                productId: productId,
                counted: counted,
                difference: difference,
                differenceCost: differenceCost,
                variantId: vp.id,
                hasVariant: item.hasVariant,
                inStock: inStock,
                isBelong: isBelong,
                displayName: `${item.displayName} (${vp.name})`,
                price: branchVariants?.price ?? vp.price,
                cost: vp.cost ?? 0,
                sku: vp.sku,
              });
            }
          });
        } else {
          const branchProducts = item.branchToProducts.find(
            (bp) => bp.branchId === branchId,
          );
          if (branchProducts) {
            acc.push({
              productId: productId,
              counted: counted,
              difference: difference,
              differenceCost: differenceCost,
              displayName: item.displayName,
              price: branchProducts.price ?? item.price,
              cost: item.cost ?? 0,
              sku: item.sku,
              isBelong: isBelong,
              inStock: inStock,
              hasVariant: item.hasVariant,
              variantId: null,
            });
          }
        }
        return acc;
      },
      [],
    );
    const historyToInventoryCounts = entity?.historyToInventoryCounts?.reduce(
      (
        acc,
        { productId, quantity, isBelong, product: item, sku, position },
      ) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts.filter(
            (vp) => vp.sku === sku,
          );
          variants.forEach((vp) => {
            const branchVariants = vp.branchVariantToProducts.find(
              (bvp) => bvp.branchId === branchId,
            );
            if (branchVariants) {
              acc.push({
                productId: productId,
                variantId: vp.id,
                hasVariant: item.hasVariant,
                quantity: quantity,
                isBelong: isBelong,
                position: position,
                displayName: `${item.displayName} (${vp.name})`,
                sku: vp.sku,
              });
            }
          });
        } else {
          const branchProducts = item.branchToProducts.find(
            (bp) => bp.branchId === branchId,
          );
          if (branchProducts) {
            acc.push({
              productId: productId,
              quantity: quantity,
              displayName: item.displayName,
              sku: item.sku,
              isBelong: isBelong,
              position: position,
              hasVariant: item.hasVariant,
              variantId: null,
            });
          }
        }
        return acc;
      },
      [],
    );

    entity.productToInventoryCounts = productToInventoryCounts;
    entity.totalDifference = totalDifference;
    entity.totalDifferenceCost = totalDifferenceCost;

    entity.historyToInventoryCounts = historyToInventoryCounts;
    return entity;
  }

  /*
  async readOneRecord(options?: FindOneOptions<InventoryCount>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    const { branchId } = entity;
    const totalDifference = entity?.productToInventoryCounts?.reduce(
      (acc, { difference }) => {
        acc += difference;
        return acc;
      },
      0,
    );
    const totalDifferenceCost = entity?.productToInventoryCounts?.reduce(
      (acc, { differenceCost }) => {
        acc += differenceCost;
        return acc;
      },
      0,
    );
    const productToInventoryCounts = entity?.productToInventoryCounts?.reduce(
      (
        acc,
        {
          productId,
          inStock,
          counted,
          difference,
          differenceCost,
          isBelong,
          product: item,
          sku,
        },
      ) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts.filter(
            (vp) => vp.sku === sku,
          );
          variants.forEach((vp) => {
            const branchVariants = vp.branchVariantToProducts.find(
              (bvp) => bvp.branchId === branchId,
            );
            if (branchVariants) {
              acc.push({
                productId: productId,
                counted: counted,
                difference: difference,
                differenceCost: differenceCost,
                variantId: vp.id,
                hasVariant: item.hasVariant,
                inStock: inStock,
                isBelong: isBelong,
                displayName: `${item.displayName} (${vp.name})`,
                price: branchVariants.price ?? vp.price,
                cost: vp.cost ?? 0,
                sku: vp.sku,
              });
            }
          });
        } else {
          const branchProducts = item.branchToProducts.find(
            (bp) => bp.branchId === branchId,
          );
          if (branchProducts) {
            acc.push({
              productId: productId,
              counted: counted,
              difference: difference,
              differenceCost: differenceCost,
              displayName: item.displayName,
              price: branchProducts.price ?? item.price,
              cost: item.cost ?? 0,
              sku: item.sku,
              isBelong: isBelong,
              inStock: inStock,
              hasVariant: item.hasVariant,
              variantId: null,
            });
          }
        }
        return acc;
      },
      [],
    );
    const historyToInventoryCounts = entity?.historyToInventoryCounts?.reduce(
      (
        acc,
        { productId, quantity, isBelong, product: item, sku, position },
      ) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts.filter(
            (vp) => vp.sku === sku,
          );
          variants.forEach((vp) => {
            const branchVariants = vp.branchVariantToProducts.find(
              (bvp) => bvp.branchId === branchId,
            );
            if (branchVariants) {
              acc.push({
                productId: productId,
                variantId: vp.id,
                hasVariant: item.hasVariant,
                quantity: quantity,
                isBelong: isBelong,
                position: position,
                displayName: `${item.displayName} (${vp.name})`,
                sku: vp.sku,
              });
            }
          });
        } else {
          const branchProducts = item.branchToProducts.find(
            (bp) => bp.branchId === branchId,
          );
          if (branchProducts) {
            acc.push({
              productId: productId,
              quantity: quantity,
              displayName: item.displayName,
              sku: item.sku,
              isBelong: isBelong,
              position: position,
              hasVariant: item.hasVariant,
              variantId: null,
            });
          }
        }
        return acc;
      },
      [],
    );

    entity.productToInventoryCounts = productToInventoryCounts;
    entity.totalDifference = totalDifference;
    entity.totalDifferenceCost = totalDifferenceCost;

    entity.historyToInventoryCounts = historyToInventoryCounts;
    console.log('DDDDDDDDDDDD32', entity);
    return entity;
  }*/
  async deleteRecord(optionsWhere: FindOptionsWhere<InventoryCount>) {
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

  mergeProductToInventoryCounts = (data: any) => {
    const mergedItem = {
      productId: data.id,
      displayName: data.displayName,
      sku: data.sku,
      quantity: 0,
      inStock: data.inStock,
      cost: data.cost,
      hasVariant: data.hasVariant,
      variantId: data?.variantId ?? '',
    };

    return mergedItem;
  };

  generateFormatInventoryCounts(
    productToInventoryCounts: Array<any>,
    branchId: string,
  ): Array<any> {
    return productToInventoryCounts.map((product) => {
      const updatedProduct = { ...product };

      if (!updatedProduct.hasVariant && updatedProduct.branchToProducts) {
        const filtered = updatedProduct.branchToProducts.find(
          (l) => l.branchId === branchId,
        );
        updatedProduct.inStock = filtered?.inStock ?? 0;
        updatedProduct.cost = filtered?.price ?? 0;
      } else if (updatedProduct.branchVariantToProducts) {
        const filtered = updatedProduct.branchVariantToProducts.find(
          (l) => l.branchId === branchId,
        );
        updatedProduct.inStock = filtered?.inStock ?? 0;
        updatedProduct.cost = filtered?.price ?? 0;
      }

      return this.mergeProductToInventoryCounts(updatedProduct);
    });
  }

  getDetailProductFromBranch = (
    productWithBranches: any,
    productToinventoryCount: any,
  ) => {
    let productDetails: any;
    if (productWithBranches.hasVariant) {
      const vp = productWithBranches.variantToProducts.find(
        (pd: { sku: any }) => pd.sku == productWithBranches.sku,
      );
      productDetails = vp.branchVariantToProducts.find(
        (bv) => bv.branchId == productToinventoryCount.branchId,
      );
    } else {
      productDetails = productWithBranches.branchToProducts.find(
        (el) => el.branchId == productToinventoryCount.branchId,
      );
    }
    return productDetails;
  };
}
