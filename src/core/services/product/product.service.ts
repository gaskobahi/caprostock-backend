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
  Repository,
} from 'typeorm';
import { CreateProductDto } from '../../dto/product/create-product.dto';
import { AbstractService } from '../abstract.service';
import { UpdateProductDto } from 'src/core/dto/product/update-product.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '../system/config.service';
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
  public readonly entity = Product
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
    const baseUrl = await this.configService.get('APP_BASE_URL'); // Get base URL from config
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
            //dt.cost = null;
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
            dt.cost = r.cost;
          }
        } else {
          if (dt.isUseProduction) {
            dt.inStock = await this.getInStockProductByBranch(
              r.branchToProducts.filter((el) => el.isAvailable),
            );
          } else {
            dt.inStock = 0;
          }
          dt.cost =
            r.bundleToProducts.reduce((accumulator, currentObject) => {
              return accumulator + currentObject.cost;
            }, 0) ?? 0;

          dt.margin = this.getMargin(dt.avgprice, r.cost);
        }
        if (dt.image)
          dt.image = `${baseUrl}/${process.env.IMAGE_PATH}/${dt.image}`; // If the item is a bundle, set inStock to 0
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
    const newArray = this.generateNewProductVersion(products.data);

    return newArray;
  }

  async readPaginatedListRecordForOrder(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductVersion(products.data);

    return newArray;
  }

  async readPaginatedListRecordForSelling(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductVersion(products.data);
    const bundleProducts = await this.generateNewProductionProductVersion(
      products.data,
    );
    (await newArray).push(...bundleProducts);
    return newArray;
  }

  async readPaginatedListRecordForProduction(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductionProductVersion(products.data);
    return newArray;
  }

  async readPaginatedListRecordForTransfertOrder(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductVersion(products.data);

    return newArray;
  }
  async generateNewProductVersion(products: Array<object>) {
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
                  isBundle: false,
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
              isBundle: false,
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

  async generateNewProductionProductVersion(products: Array<object>) {
    const newArray: Array<object> = [];

    for (const item of products as any) {
      if (item.isBundle && item.isUseProduction) {
        const _costsum = item.bundleToProducts.reduce(
          (accumulator, currentObject) => {
            return accumulator + currentObject.cost;
          },
          0,
        );
        const newItem = {
          id: item.id,
          reference: item.reference,
          barreCode: item.barreCode,
          displayName: item.displayName,
          price: item.price,
          cost: _costsum,
          sku: item.sku,
          branchToProducts: item.branchToProducts,
          isBundle: true,
          hasVariant: item.hasVariant,
          variantId: null,
          branchVariantToProducts: [],
        };
        newArray.push(newItem);
        /*if (item.branchToProducts.length > 0) {
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
              branchToProducts: branchToProducts,
            };
            newArray.push(newItem);
          }
        }*/
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

  async getFindOneByProductIdWithBranch(productId: string) {
    return await this.readOneRecord({
      relations: {
        variantToProducts: { branchVariantToProducts: true },
        branchToProducts: true,
      },
      where: { id: productId },
    });
  }

  async isBundle(productId: string) {
    return await this.repository.existsBy({ id: productId, isBundle: true });
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

  async getDetails(productId: string) {
    return await this.readOneRecord({
      relations: {
        variantToProducts: { branchVariantToProducts: true },
        branchToProducts: true,
        bundleToProducts: {
          product: {
            bundleToProducts: true,
            branchToProducts: true,
          },
        },
      },
      where: { id: productId },
    });
  }

  /**
   * Récupère le stock actuel d'un produit pour une branche spécifique.
   */
  getBranchStock(product: any, deliveryProductData: any): number {
    if (product.hasVariant) {
      // 🔹 Étape 1 : Filtrer les variantes du produit correspondant
      const variantList = product.variantToProducts.filter(
        (variant) =>
          variant.productId === deliveryProductData.productId &&
          variant.sku == deliveryProductData.sku,
      );

      // 🔹 Étape 2 : Filtrer les stocks de la branche actuelle
      return variantList
        .flatMap((variant) => variant.branchVariantToProducts) // Récupère toutes les entrées `branchVariantToProducts`
        .filter(
          (branchVariant) =>
            branchVariant.branchId === deliveryProductData.destinationBranchId,
        )
        .reduce((total, variant) => total + variant.inStock, 0);
    } /*else if (product.isBundle) {
      // Pour les bundles, on filtre les stocks de la branche
      const branchBundle = product.branchToProducts.find(
        (branch) =>
          branch.branchId === deliveryProductData.destinationBranchId &&
          branch.productId == deliveryProductData.productId,
      );
      return branchBundle ? branchBundle.inStock : 0;
    } */ else {
      if (product.id != deliveryProductData.productId) {
        deliveryProductData = { ...deliveryProductData, productId: product.id };
      }
      // Produit simple, on récupère directement le stock dans la branche
      const branchProduct = product.branchToProducts.find(
        (branch) =>
          branch.branchId === deliveryProductData.destinationBranchId &&
          branch.productId == deliveryProductData.productId,
      );
      return branchProduct ? branchProduct.inStock : 0;
    }
  }
}
