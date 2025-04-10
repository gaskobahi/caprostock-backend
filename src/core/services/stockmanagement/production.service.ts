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
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { Production } from 'src/core/entities/stockmanagement/production.entity';
import { CreateProductionDto } from 'src/core/dto/stockmanagement/create-production.dto';
import { UpdateProductionDto } from 'src/core/dto/stockmanagement/update-production.dto';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';
import { ProductionStatusEnum } from 'src/core/definitions/enums';

@Injectable()
export class ProductionService extends AbstractService<Production> {
  public NOT_FOUND_MESSAGE = `Ajustement de stock non trouvé`;

  constructor(
    @InjectRepository(Production)
    private _repository: Repository<Production>,
    private readonly branchToProductService: BranchToProductService,
    private readonly productService: ProductService,

    protected paginatedService: PaginatedService<Production>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Production> {
    return this._repository;
  }

  async readPaginatedListRecord(
    options?: FindManyOptions<Production>,
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

    // Retrieve detailed records for each item in the paginated response
    const detailedRecords = await Promise.all(
      response.data.map(async (record) => {
        return this.readOneRecord({
          ...options,
          where: { ...options?.where, id: record.id },
        });
      }),
    );
    // Update response data with detailed records
    response.data = detailedRecords;
    console.log('tettetet', response);
    // Update response data with processed items and return
    return response;
  }

  /*async createRecord(dto: CreateProductionDto): Promise<Production> {
    const result = await super.createRecord({ ...dto });
    if (result) {
      for (const productionToProduct of dto.productionToProducts) {
        const productionProductData = {
          ...productionToProduct,
          destinationBranchId: result.destinationBranchId,
          productionId: result.id,
          type: result.type,
        };
        await this.updateStocks(productionProductData);

        // work for update stock of item of this composed item
        const ciDetails = await this.productService.getDetails(
          productionProductData.productId,
        );
        //level1
        if (ciDetails) {
          for (const itemProduct of ciDetails.bundleToProducts) {
            //check isBundle
            const ItemProductData = {
              ...itemProduct,
              bundleId: itemProduct.bundleId,
              quantity: productionToProduct.quantity * itemProduct.quantity,
              destinationBranchId: result.destinationBranchId,
            };
            if (await this.productService.isBundle(itemProduct.bundleId)) {
              //level2
              const ciDetails2 = await this.productService.getDetails(
                itemProduct.bundleId,
              );

              const headciDetails2 = {
                ...productionToProduct,
                productId: ciDetails2.id,
                destinationBranchId: result.destinationBranchId,
                productionId: result.id,
                type: result.type,
              };
              await this.updateStocks(headciDetails2);

              for (const itemProduct2 of ciDetails2.bundleToProducts) {
                //check isBundle
                const ItemProductData2 = {
                  ...itemProduct2,
                  bundleId: itemProduct2.bundleId,
                  quantity:
                    productionToProduct.quantity * itemProduct2.quantity,
                  destinationBranchId: result.destinationBranchId,
                };
                if (await this.productService.isBundle(itemProduct2.bundleId)) {
                } else {
                  await this.addAndReduceStocks(
                    productionProductData.type,
                    ItemProductData2,
                  );
                }
              }
            } else {
              //update bundleProduct is notBundle
              if (
                productionProductData.type == ProductionStatusEnum.production
              ) {
                await this.updateComposedItemReduceStocks(ItemProductData);
              }
              if (
                productionProductData.type == ProductionStatusEnum.disassembly
              ) {
                await this.updateComposedItemAddStocks(ItemProductData);
              }
            }
          }
        }
      }
    }
    return result as any;
  }*/

  async createRecord(dto: CreateProductionDto): Promise<Production> {
    const result = await super.createRecord({ ...dto });
    if (!result) return result as any;

    const handleBundleProducts = async (productionProductData, products) => {
      for (const itemProduct of products) {
        const itemProductData = {
          ...itemProduct,
          bundleId: itemProduct.bundleId,
          quantity: productionProductData.quantity * itemProduct.quantity,
          destinationBranchId: result.destinationBranchId,
        };

        if (await this.productService.isBundle(itemProduct.bundleId)) {
          const ciDetails2 = await this.productService.getDetails(
            itemProduct.bundleId,
          );
          const headCiDetails2 = {
            ...productionProductData,
            productId: ciDetails2.id,
            destinationBranchId: result.destinationBranchId,
            productionId: result.id,
            type: result.type,
          };
          await this.updateStocks(headCiDetails2);
          await handleBundleProducts(
            productionProductData,
            ciDetails2.bundleToProducts,
          );
        } else {
          await this.addAndReduceStocks(
            productionProductData.type,
            itemProductData,
          );
        }
      }
    };

    for (const productionToProduct of dto.productionToProducts) {
      const productionProductData = {
        ...productionToProduct,
        destinationBranchId: result.destinationBranchId,
        productionId: result.id,
        type: result.type,
      };
      await this.updateStocks(productionProductData);

      const ciDetails = await this.productService.getDetails(
        productionProductData.productId,
      );
      if (ciDetails) {
        await handleBundleProducts(
          productionProductData,
          ciDetails.bundleToProducts,
        );
      }
    }

    return result as any;
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Production>,
    dto: UpdateProductionDto,
  ) {
    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });

    return result;
  }

  /* async getFilterByAuthUserBranch(): Promise<
    FindOptionsWhere<Production>
  > {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchToProductions: {
          branchId: authUser.targetBranchId,
        },
      };
    }

    return {};
  }*/

  /*async readPaginatedListRecordForComposite(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const productions = await this.readPaginatedListRecord(
      options,
      page,
      perPage,
    );
    const array: Array<object> = [];
    for (const item of productions.data as any) {
      if (!item.hasVariant) {
        if (!item.isBundle) {
          array.push(item);
        } else {
          if (item?.bundleToProductions.length < 3) {
            array.push(item);
          }
        }
      }
    }
    return array;
  }*/

  async readOneRecord(options?: FindOneOptions<Production>) {
    const res = await this.repository.findOne(options);
    if (!res) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const entity = { ...res, totalQuantities: 0, productionId: res.id } as any;
    const { destinationBranchId } = entity;

    const newProductionToProducts = entity?.productionToProducts?.reduce(
      (
        acc: {
          productId: any;
          quantity: any;
          cost: any;
          displayName: string;
          sku: any;
        }[],
        { productId, quantity, cost, product: item, sku }: any,
      ) => {
        const srcbranchProducts = item.branchToProducts.find(
          (bp: { branchId: any }) => bp.branchId === destinationBranchId,
        );

        if (srcbranchProducts) {
          acc.push({
            productId: productId,
            quantity: quantity,
            cost: cost,
            displayName: `${item.displayName}`,
            sku: sku,
          });
        }

        return acc;
      },
      [],
    );
    entity.productionToProducts = newProductionToProducts;
    entity.totalQuantities = this.totalQuantities(entity);
    return entity;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<Production>) {
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

  async updateStocks(productionProductData: any): Promise<void> {
    const prd = await this.productService.getDetails(
      productionProductData.productId,
    );

    if (productionProductData.type == ProductionStatusEnum.production) {
      await this.updateProductStock(
        prd.branchToProducts,
        productionProductData,
      );
      0;
    }
    if (productionProductData.type == ProductionStatusEnum.disassembly) {
      await this.updateProductReduceStock(
        prd.branchToProducts,
        productionProductData,
      );
    }
  }

  async updateComposedItemAddStocks(productionProductData: any): Promise<void> {
    const prd = await this.productService.getDetails(
      productionProductData.bundleId,
    );
    if (prd.trackStock) {
      await this.updateProductStock(prd.branchToProducts, {
        ...productionProductData,
        productId: prd.id,
      });
    }
  }

  async updateComposedItemReduceStocks(
    productionProductData: any,
  ): Promise<void> {
    const prd = await this.productService.getDetails(
      productionProductData.bundleId,
    );
    if (prd.trackStock) {
      await this.updateProductReduceStock(prd.branchToProducts, {
        ...productionProductData,
        productId: prd.id,
      });
    }
  }

  private async updateProductStock(
    branchToProducts: any,
    dto: any,
  ): Promise<void> {
    const currentBranchStock = branchToProducts.find(
      (el) =>
        el.productId === dto.productId &&
        el.branchId === dto.destinationBranchId,
    );
    await this.branchToProductService.updateRecord(
      {
        productId: dto.productId,
        branchId: dto.destinationBranchId,
      },
      { inStock: currentBranchStock.inStock + dto.quantity },
    );
  }

  private async addAndReduceStocks(
    productionType: string,
    ItemProductData: any,
  ): Promise<void> {
    if (productionType == ProductionStatusEnum.production) {
      await this.updateComposedItemReduceStocks(ItemProductData);
    }
    if (productionType == ProductionStatusEnum.disassembly) {
      await this.updateComposedItemAddStocks(ItemProductData);
    }
  }
  private async updateProductReduceStock(
    branchToProducts: any,
    dto: any,
  ): Promise<void> {
    const currentBranchStock = branchToProducts.find(
      (el) =>
        el.productId === dto.productId &&
        el.branchId === dto.destinationBranchId,
    );

    await this.branchToProductService.updateRecord(
      {
        productId: dto.productId,
        branchId: dto.destinationBranchId,
      },
      { inStock: currentBranchStock.inStock - dto.quantity },
    );
  }

  totalQuantities(entity: { productionToProducts: any[] }) {
    if (!entity?.productionToProducts) {
      return 0;
    }
    return entity?.productionToProducts?.reduce(
      (acc: any, current: { quantity: any }) => acc + (current.quantity || 0),
      0,
    );
  }
}
