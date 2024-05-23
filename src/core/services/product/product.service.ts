import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
  removeImage,
} from '@app/typeorm';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../../entities/product/product.entity';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { CreateProductDto } from '../../dto/product/create-product.dto';
import { AbstractService } from '../abstract.service';
import { UpdateProductDto } from 'src/core/dto/product/update-product.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '../system/config.service';
import * as fs from 'file-system';
import {
  ProductsymbolTypeEnum,
  TaxOptionEnum,
} from 'src/core/definitions/enums';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { TaxService } from '../setting/tax.service';
import { TaxToProductService } from './tax-to-product.service';

@Injectable()
export class ProductService extends AbstractService<Product> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé`;

  constructor(
    @InjectRepository(Product)
    private _repository: Repository<Product>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TaxService))
    private readonly taxService: TaxService,
    private readonly taxToProductService: TaxToProductService,

    protected paginatedService: PaginatedService<Product>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Product> {
    return this._repository;
  }

  async readPaginatedListRecord(
    options?: FindManyOptions<Product>,
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

    // Process each item in the paginated data asynchronously
    await Promise.all(
      response?.data.map(async (r) => {
        const dt: any = r;
        dt.avgprice = await this.getAveragePriceByBranch(dt.branchToProducts);
        // Calculate margin for each item
        dt.margin = this.getMargin(dt.avgprice ?? r.price, r.cost);
        if (!dt.isBundle) {
          if (dt.hasVariant) {
            // If the item has variants, process them
            dt.price = null;
            dt.cost = null;
            if (dt?.variantToProducts) {
              // Calculate inStock for the item
              dt.inStock = await this.getInStockVariantProductByBranch(
                dt?.variantToProducts,
              );
              // Process each variant of the item asynchronously
              const dataVariant2 = await Promise.all(
                dt?.variantToProducts &&
                  dt.variantToProducts?.map(async (vp) => {
                    const v: any = vp;

                    // Calculate average price for the variant
                    v.avgprice = await this.getAveragePriceByBranch(
                      v.branchVariantToProducts,
                    );
                    // Calculate margin for the variant
                    v.margin = this.getMargin(v.avgprice ?? v.price, v.cost);
                    // Calculate inStock for the variant
                    v.inStock = await this.getInStockItemVariantProductByBranch(
                      v.branchVariantToProducts,
                    );
                    return v;
                  }),
              );

              // Calculate average margin for all variants
              dt.margin =
                await this.getAverageMarginItemVariantProduct(dataVariant2);
              dt.variantToProducts = dataVariant2;
            }
          } else {
            // If the item does not have variants, calculate inStock directly
            dt.inStock = await this.getInStockProductByBranch(
              r.branchToProducts,
            );
          }
        } else {
          // If the item is a bundle, set inStock to 0
          dt.inStock = 0;
        }
      }),
    );

    // Update response data with processed items and return
    return response;
  }

  async createRecord(ddto: any, file?: any): Promise<Product> {
    const filename = file?.filename;
    const dto = plainToInstance(CreateProductDto, ddto);
    //set image
    if (filename) {
      dto.image = file?.filename;
    }
    const errors = await validate(dto);
    if (errors.length > 0) {
      //remove file if with erro
      if (file) {
        removeImage(process.env.IMAGE_PATH, file.filename);
      }
      const validationErrors = errors
        .map((err) => Object.values(err.constraints))
        .flat();
      throw new BadRequestException(
        `Validation failed: ${validationErrors[0]}`,
        //`Validation failed: ${validationErrors.join(', ')}`,
      );
    }
    // Check unique reference
    if (dto.reference) {
      await isUniqueConstraint(
        'reference',
        Product,
        { reference: dto.reference },
        {
          message: `La référence "${dto.reference}" du produit est déjà utilisée`,
        },
      );
    }

    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displayName',
        Product,
        { displayName: dto.displayName },
        {
          message: `Le nom "${dto.displayName}" du produit est déjà utilisée`,
        },
      );
    }
    console.log('JKJGHKJHKHJHJ', dto);

    const result = await super.createRecord({ ...dto, isActive: true });
    if (result) {
      //associe le produit aux taxes existante
      const listTax = await this.taxService.repository.find();
      for (const el of listTax) {
        if (
          el.option == TaxOptionEnum.applyToNewAndExitingItems ||
          el.option == TaxOptionEnum.applyToNewItems
        ) {
          await this.taxToProductService.createRecord({
            taxId: el.id,
            productId: result.id,
          });
        }
      }
    }

    return result;
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Product>,
    ddto: any,
    file?: any,
  ) {
    const filename = file?.filename;
    console.log('KYLIAN0', typeof ddto);
    const dto = plainToInstance(UpdateProductDto, ddto);
    const prevProduct = await this._repository.findOneBy({
      id: optionsWhere.id,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      //remove file if with erro
      if (file) {
        removeImage(process.env.IMAGE_PATH, file.filename);
      }
      const validationErrors = errors
        .map((err) => Object.values(err.constraints))
        .flat();
      throw new BadRequestException(
        `Validation failed: ${validationErrors[0]}`,
        //`Validation failed: ${validationErrors.join(', ')}`,
      );
    }

    if (filename) {
      dto.image = filename;
    } else {
      if (dto.symbolType == ProductsymbolTypeEnum.image) {
        delete dto.image;
      } else {
        dto.image = null;
      }
    }
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Product,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" du produit est déjà utilisé` },
      );
    }

    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });

    //remove previus image of this product
    if (result) {
      if (prevProduct.image && filename) {
        removeImage(process.env.IMAGE_PATH, prevProduct.image);
      }
      //suprimer l'image si symbolType est egale à  colorShape
      if (
        prevProduct.image &&
        dto.symbolType == ProductsymbolTypeEnum.colorShape
      ) {
        removeImage(process.env.IMAGE_PATH, prevProduct.image);
      }
    }
    return result;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Product>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchToProducts: {
          branchId: authUser.targetBranchId,
        },
      };
    }

    return {};
  }
  async generateNewSKUCode(): Promise<FindOptionsWhere<any>> {
    const maxSkuProduct = await this._repository.find({
      relations: {
        variantToProducts: true,
      },
      order: {
        sku: 'DESC',
      },
      take: 1,
    });
    let newSku: number;
    if (maxSkuProduct.length > 0) {
      if (maxSkuProduct[0]?.hasVariant) {
        const maxSku =
          maxSkuProduct[0]?.variantToProducts &&
          maxSkuProduct[0]?.variantToProducts.reduce((max, product) => {
            return product.sku > max ? product.sku : max;
          }, 0);
        newSku = maxSku + 1;
      } else {
        newSku = maxSkuProduct[0]?.sku + 1;
      }
    } else {
      newSku = 1000;
    }
    return { newSku: newSku };
  }

  async readPaginatedListRecordForComposite(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const array: Array<object> = [];
    for (const item of products.data as any) {
      if (!item.hasVariant) {
        if (!item.isBundle) {
          array.push(item);
        } else {
          if (item?.bundleToProducts.length < 3) {
            array.push(item);
          }
        }
      }
    }
    return array;
  }

  async readPaginatedListRecordForInventoryCount(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProcuctVersion(products.data);

    return newArray;
  }

  async generateNewProcuctVersion(products: Array<object>) {
    const newArray: Array<object> = [];

    for (const item of products as any) {
      if (!item.isBundle && item.trackStock) {
        if (item.hasVariant) {
          if (item.variantToProducts.length > 0) {
            for (const vp of item.variantToProducts) {
              const branchVariantToProducts = vp.branchVariantToProducts.filter(
                (e: any) => e.isAvailable == true,
              );
              if (branchVariantToProducts.length > 0) {
                const newItem = {
                  id: item.id,
                  reference: item.reference,
                  variantId: vp.id,
                  hasVariant: item.hasVariant,
                  barreCode: vp.barreCode,
                  displayName: `${item.displayName}(${vp.name})`,
                  price: vp.price,
                  cost: vp.cost,
                  sku: vp.sku,
                  branchVariantToProducts: branchVariantToProducts,
                  branchToProducts: [],
                };
                newArray.push(newItem);
              }
            }
          }
        } else if (item.branchToProducts.length > 0) {
          const branchToProducts = item.branchToProducts.filter(
            (e: any) => e.isAvailable == true,
          );
          if (branchToProducts.length > 0) {
            const newItem = {
              id: item.id,
              reference: item.reference,
              barreCode: item.barreCode,
              displayName: item.displayName,
              price: item.price,
              cost: item.cost,
              sku: item.sku,
              hasVariant: item.hasVariant,
              variantId: null,
              branchToProducts: branchToProducts,
              branchVariantToProducts: [],
            };
            newArray.push(newItem);
          }
        }
      }
    }
    return newArray;
  }
  async readPaginatedListRecordForStockAdjustment(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const array: Array<object> = [];
    for (const item of products.data as any) {
      if (item.trackStock) {
        if (!item.isBundle) {
          if (
            item.branchToProducts.length > 0 ||
            item.variantToProducts.length > 0
          ) {
            array.push(item);
          }
        }
      }
    }
    return array;
  }

  async readOneRecord(options?: FindOneOptions<Product>) {
    const entity = await this.repository.findOne(options);
    if (entity?.image) {
      const baseUrl = await this.configService.get('APP_BASE_URL'); // Get base URL from config
      const _image = `${baseUrl}/${process.env.IMAGE_PATH}/${entity.image}`;
      entity.image = _image;
    }
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    return entity;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<Product>) {
    const entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    entity.updatedById = authUser?.id;
    entity.deletedById = authUser?.id;
    const result = await this.repository.remove(entity);
    if (result && entity.image) {
      removeImage(process.env.IMAGE_PATH, entity.image);
    }
    return result;
  }

  async getProductsAndTaxToProducts(): Promise<Product[]> {
    const products = await this._repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.taxToProducts', 'taxToProduct')
      .getMany();
    return products;
  }

  async getInStockProductByBranch(branchToProducts: any): Promise<number> {
    let inStock: number = 0;
    for (const el of branchToProducts) {
      inStock += el.inStock ?? 0;
    }

    return inStock;
  }

  async getInStockVariantProductByBranch(
    variantToProducts: any = [],
  ): Promise<number> {
    let inStock: number = 0;
    for (const el of variantToProducts) {
      for (const al of el.branchVariantToProducts) {
        inStock += al.inStock ?? 0;
      }
    }

    return inStock;
  }

  async getInStockItemVariantProductByBranch(
    branchVariantToProducts: any,
  ): Promise<number> {
    let inStock: number = 0;
    for (const al of branchVariantToProducts) {
      inStock += al.inStock ?? 0;
    }
    return inStock;
  }

  async getAverageMarginItemVariantProduct(
    VariantToProducts: any,
  ): Promise<number> {
    const arrayMargins = [];
    for (const al of VariantToProducts) {
      arrayMargins.push(al.margin ?? 0);
    }
    return this.calculateAveragePrice(arrayMargins);
  }

  async getAveragePriceByBranch(
    branchVariantToProducts: any = [],
  ): Promise<number> {
    const arrayPrices = [];
    for (const al of branchVariantToProducts) {
      arrayPrices.push(al.price ?? 0);
    }
    return this.calculateAveragePrice(arrayPrices);
  }
}
