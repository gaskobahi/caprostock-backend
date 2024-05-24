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
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { ReasonService } from './reason.service';
import { InventoryCount } from 'src/core/entities/stockmanagement/inventorycount.entity';
import { CreateInventoryCountDto } from 'src/core/dto/stockmanagement/create-inventory-count.dto';
import { UpdateInventoryCountDto } from 'src/core/dto/stockmanagement/update-inventory-count.dto';
import {
  InventoryCountStatusEnum,
  InventoryCountTypeEnum,
} from 'src/core/definitions/enums';
import { ProductService } from '../product/product.service';
import { CreateProductDto } from 'src/core/dto/product/create-product.dto';
import { UpdateInventoryCountSaveDto } from 'src/core/dto/stockmanagement/update-inventory-count-save.dto';

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

    protected paginatedService: PaginatedService<InventoryCount>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<InventoryCount> {
    return this._repository;
  }

  async readPaginatedListRecord(
    options?: FindManyOptions<InventoryCount>,
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

  async createRecord(dto: CreateInventoryCountDto): Promise<InventoryCount> {
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

  async updateRecordCountSave(
    optionsWhere: FindOptionsWhere<InventoryCount>,
    dto: UpdateInventoryCountSaveDto,
  ) {
    const previousIC = await this.repository.findOneBy(optionsWhere);

    if (previousIC.status == InventoryCountStatusEnum.completed) {
      throw new BadRequestException(
        'Impossible de modifier le statut déja complèté',
      );
    }
    if (dto.action == InventoryCountStatusEnum.inProgress) {
      dto.status = InventoryCountStatusEnum.inProgress;
    }
    if (dto.action == InventoryCountStatusEnum.completed) {
      dto.status = InventoryCountStatusEnum.completed;
    }
    for (const el of dto.productToInventoryCounts) {
     /* a continueer const prd = await this.productService.readOneRecord({
        relations: { branchVariantToProducts: true },
        where:*/
      el.difference = (el?.counted || 0) - (el.inStock || 0);
      //el.differenceCost = (el?.difference || 0) * (el.price || 0)
    }
    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });

    if (result) {
      if (dto.action == InventoryCountStatusEnum.completed) {
        for (const pi of dto.productToInventoryCounts) {
          //find product by Id
          const prd = await this.productService.readOneRecord({
            relations: { variantToProducts: true },
            where: { id: pi.productId },
          });
          if (pi.counted > 0) {
            //pi.difference = (pi?.counted || 0) - (pi.inStock || 0);
            //pi.difference = (pi?.counted || 0) - (pi.inStock || 0);
            //update branch for product variant
            if (prd.hasVariant) {
              const vp = prd.variantToProducts.find((el) => el.sku == pi.sku);
              // pi.differenceCost = (pi?.difference || 0) * (vp.price || 0);

              await this.branchVariantToProductService.updateRecord(
                {
                  variantId: vp.id,
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

    return result;
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
  }
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
  /*generateFormatInventoryCounts = (
    productToInventoryCounts: Array<object>,
    branchId: string,
  ) => {
    const newArray = [];
    for (const newdata of productToInventoryCounts) {
      console.log('dfdfdfdfdfdf', newdata);
      const newdatad = {
        ...data,
      }; // Créer une copie de newdata
      console.log('Lot1', newdata);
      if (!newdata.hasVariant) {
        if (newdata?.branchToProducts) {
          const filtered: any = newdata?.branchToProducts?.find(
            (l) => l.branchId == branchId,
          );
          newdata.inStock = filtered.inStock ?? 0;
          newdata.cost = filtered.price ?? 0;
        }
        const mergedValue = this.mergeProductToInventoryCounts(newdata);
        newArray.push(mergedValue);
      } else {
        if (newdata?.branchVariantToProducts) {
          const filtered: any = newdata?.branchVariantToProducts?.find(
            (l) => l.branchId == branchId,
          );
          newdata?.inStock = filtered.inStock ?? 0;
          newdata?.cost = filtered.price ?? 0;
        }
        const mergedValue = this.mergeProductToInventoryCounts(newdata);
        newArray.push(mergedValue);
      }
    }
  };*/
}
