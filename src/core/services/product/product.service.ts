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
import { VariantToProduct } from 'src/core/entities/product/variant-to-product.entity';

@Injectable()
export class ProductService extends AbstractService<Product> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé`;
  public readonly entity = Product;
  constructor(
    @InjectRepository(Product)
    private _repository: Repository<Product>,
    @InjectRepository(VariantToProduct)
    private readonly variantRepository: Repository<VariantToProduct>,
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
    const products = await this.paginatedService.paginate(
      this.repository,
      page,
      perPage,
      options,
    );
    console.log('gffgflkkl',options)

    // Process each item in the paginated data asynchronously
    await Promise.all(
      products?.data.map(async (r) => {
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
                  dt.variantToProducts?.map(async (vp: any) => {
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
          dt.bundleToProducts = await this._newBundleToProduct(
            dt.bundleToProducts,
          );
        }
        if (dt.image)
          dt.image = `${baseUrl}/${process.env.IMAGE_PATH}/${dt.image}`; // If the item is a bundle, set inStock to 0
      }),
    );
    // Update response data with processed items and return
    return products;
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
    if (dto.isBundle) {
      dto.bundleToProducts = await this.verifyBundleProducts(
        dto.bundleToProducts,
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

    if (dto.isBundle) {
      dto.bundleToProducts = await this.verifyBundleProducts(
        dto.bundleToProducts,
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
      //if (!item.hasVariant) {
      if (!item.isBundle) {
        array.push(item);
      } else {
        if (item?.bundleToProducts.length < 3) {
          array.push(item);
        }
      }
      //}
    }
    return array;
  }

  async readPaginatedListRecordForInventoryCount(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    console.log('iuiuiui', options);
    const authUser = await super.checkSessionBranch();
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductVersion(products.data, authUser);

    return newArray;
  }

  async readPaginatedListRecordForOrder(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const authUser = await super.checkSessionBranch();
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductVersion(products.data, authUser);

    return newArray;
  }

  async readPaginatedListRecordForSelling(
    options?: FindManyOptions<any>,
    page?: number,
    perPage?: number,
  ) {
    const authUser = await super.checkSessionBranch();
    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = await this.generateNewProductVersion(
      products.data,
      authUser,
    );
    const bundleProducts = await this.generateNewProductionProductVersion(
      products.data,
      authUser,
    );
    console.log('eaeolingerlll', newArray);
    newArray.push(...bundleProducts);
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
    const authUser = await super.checkSessionBranch();

    const products = await this.readPaginatedListRecord(options, page, perPage);
    const newArray = this.generateNewProductVersion(products.data, authUser);

    return newArray;
  }
  /*async generateNewProductVersion(
    products: Array<object>,
    authUser?: AuthUser,
  ) {
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
                const bp = branchVariantToProducts.find(
                  (e: any) =>
                    e.isAvailable === true &&
                    e.branchId === authUser.targetBranchId,
                );

                const newItem = {
                  id: item.id,
                  reference: item.reference,
                  variantId: vp.id,
                  hasVariant: item.hasVariant,
                  isBundle: false,
                  isUseProduction: false,
                  categoryName: item?.category.displayName,
                  categoryId: item?.categoryId,
                  barreCode: vp.barreCode,
                  bunbleItemName: null,
                  displayName: `${item.displayName}(${vp.name})`,
                  price: bp.price > 0 ? bp.price : vp.price,
                  cost: vp.cost,
                  sku: vp.sku,
                  image: item.image,
                  colorShape: item.colorShape,
                  branchVariantToProducts: branchVariantToProducts,
                  branchToProducts: [],
                };
                newArray.push(newItem);
              }
            }
          }
        } else if (item.branchToProducts.length > 0) {
          const branchToProducts = item.branchToProducts.filter(
            (e: any) => e.isAvailable === true,
          );
          if (branchToProducts.length > 0) {
            const bp = branchToProducts.find(
              (e: any) =>
                e.isAvailable === true &&
                e.branchId === authUser.targetBranchId,
            );

            const newItem = {
              id: item.id,
              reference: item.reference,
              barreCode: item.barreCode,
              displayName: item.displayName,
              price: bp.price > 0 ? bp.price : item.price,
              cost: item.cost,
              sku: item.sku,
              isBundle: item.isUseProduction,
              isUseProduction: item.isUseProduction,
              categoryName: item?.category.displayName,
              categoryId: item?.categoryId,
              hasVariant: item.hasVariant,
              bunbleItemName: null,
              variantId: null,
              image: item.image,
              colorShape: item.colorShape,
              branchToProducts: branchToProducts,
              branchVariantToProducts: [],
            };
            newArray.push(newItem);
          }
        }
      }
    }
    return newArray;
  }*/

  getProductBranchPrice(bToProducts, targetBranchId) {
    const bp = bToProducts.find((e: any) => e.branchId === targetBranchId);
    return bp;
  }
  async generateNewProductVersion(products: any[], authUser?: AuthUser) {
    const newArray: any[] = [];

    for (const item of products) {
      if (!item.isBundle && item.trackStock) {
        console.log('IOIOIIOIO', item.hasVariant);
        // Cas avec variantes
        if (item.hasVariant && item.variantToProducts?.length > 0) {
          for (const vp of item.variantToProducts) {
            const branchVariantToProducts =
              vp.branchVariantToProducts?.filter(
                (e: any) => e.isAvailable === true,
              ) || [];

            if (branchVariantToProducts.length > 0) {
              const bp = branchVariantToProducts.find(
                (e: any) => e.branchId === authUser?.targetBranchId,
              );

              if (bp) {
                newArray.push({
                  id: item.id,
                  reference: item.reference,
                  variantId: vp.id,
                  hasVariant: true,
                  isBundle: false,
                  isUseProduction: false,
                  categoryName: item?.category?.displayName,
                  categoryId: item?.categoryId,
                  barreCode: vp.barreCode,
                  bunbleItemName: null,
                  displayName: `${item.displayName}(${vp.name})`,
                  price: bp.price > 0 ? bp.price : vp.price,
                  inStock: bp.inStock > 0 ? bp.inStock : 0,
                  cost: vp.cost,
                  sku: vp.sku,
                  image: item.image,
                  colorShape: item.colorShape,
                  branchVariantToProducts,
                  branchToProducts: [],
                });
              }
            }
          }
        }

        // Cas sans variantes
        else if (item.branchToProducts?.length > 0) {
          const branchToProducts = item.branchToProducts.filter(
            (e: any) => e.isAvailable === true,
          );

          if (branchToProducts.length > 0) {
            const bp = branchToProducts.find(
              (e: any) => e.branchId === authUser?.targetBranchId,
            );

            if (bp) {
              newArray.push({
                id: item.id,
                reference: item.reference,
                barreCode: item.barreCode,
                displayName: item.displayName,
                price: bp.price > 0 ? bp.price : item.price,
                inStock: bp.inStock > 0 ? bp.inStock : 0,

                cost: item.cost,
                sku: item.sku,
                isBundle: false,
                isUseProduction: item.isUseProduction,
                categoryName: item?.category?.displayName,
                categoryId: item?.categoryId,
                hasVariant: false,
                bunbleItemName: null,
                variantId: null,
                image: item.image,
                colorShape: item.colorShape,
                branchToProducts,
                branchVariantToProducts: [],
              });
            }
          }
        }
      }
    }

    return newArray;
  }

  async generateNewProductBundleVersion(item: any, targetBranchId?: any) {
    let newArray: any;

    if (item.isBundle && item.isUseProduction) {
      // Calcul du coût total
      const totalCost =
        item.bundleToProducts?.reduce(
          (sum: number, curr: { cost: number }) => sum + (curr?.cost || 0),
          0,
        ) || 0;

      const bundleItemName = this.getBundleItemName(item.bundleToProducts);

      const branchToProducts =
        item.branchToProducts?.filter((e: any) => e.isAvailable === true) || [];

      if (branchToProducts.length > 0) {
        const bp = branchToProducts.find(
          (e: any) => e.branchId === targetBranchId,
        );

        if (bp) {
          newArray = {
            id: item.id,
            reference: item.reference,
            barreCode: item.barreCode,
            displayName: item.displayName,
            price: bp.price > 0 ? bp.price : item.price,
            inStock: bp.inStock > 0 ? bp.inStock : 0,
            cost: totalCost,
            sku: item.sku,
            branchToProducts,
            isBundle: true,
            bunbleItemName: bundleItemName,
            hasVariant: item.hasVariant,
            categoryName: item?.category?.displayName,
            image: item.image,
            colorShape: item.colorShape,
            variantId: null,
            branchVariantToProducts: [],
          };
        }
      }
    }

    return newArray;
  }
  async generateNewProductSingleNotBundleVersion(
    item: any,
    targetBranchId?: AuthUser,
  ) {
    let arr: any;
    //if (!item.isBundle && item.trackStock) {
    // Cas avec variantes
    if (item.hasVariant && item.variantToProducts?.length > 0) {
      for (const vp of item.variantToProducts) {
        const branchVariantToProducts =
          vp.branchVariantToProducts?.filter(
            (e: any) => e.isAvailable === true,
          ) || [];

        if (branchVariantToProducts.length > 0) {
          const bp = branchVariantToProducts.find(
            (e: any) => e.branchId === targetBranchId,
          );

          if (bp) {
            arr = {
              id: item.id,
              reference: item.reference,
              variantId: vp.id,
              hasVariant: true,
              isBundle: false,
              isUseProduction: false,
              categoryName: item?.category?.displayName,
              categoryId: item?.categoryId,
              barreCode: vp.barreCode,
              bunbleItemName: null,
              displayName: `${item.displayName}(${vp.name})`,
              price: bp.price > 0 ? bp.price : vp.price,
              inStock: bp.inStock > 0 ? bp.inStock : 0,
              cost: vp.cost,
              sku: vp.sku,
              image: item.image,
              colorShape: item.colorShape,
              branchVariantToProducts,
              branchToProducts: [],
            };
          }
        }
      }
    }

    // Cas sans variantes
    else if (item.branchToProducts?.length > 0) {
      const branchToProducts = item.branchToProducts.filter(
        (e: any) => e.isAvailable === true,
      );

      if (branchToProducts.length > 0) {
        const bp = branchToProducts.find(
          (e: any) => e.branchId === targetBranchId,
        );

        if (bp) {
          arr = {
            id: item.id,
            reference: item.reference,
            barreCode: item.barreCode,
            displayName: item.displayName,
            price: bp.price > 0 ? bp.price : item.price,
            inStock: bp.inStock > 0 ? bp.inStock : 0,

            cost: item.cost,
            sku: item.sku,
            isBundle: false,
            isUseProduction: item.isUseProduction,
            categoryName: item?.category?.displayName,
            categoryId: item?.categoryId,
            hasVariant: false,
            bunbleItemName: null,
            variantId: null,
            image: item.image,
            colorShape: item.colorShape,
            branchToProducts,
            branchVariantToProducts: [],
          };
        }
      }
    }
    // }
    return arr;
  }

  getBundleItemName(bundleToProducts: any[]): string {
    if (!Array.isArray(bundleToProducts)) return '';

    return bundleToProducts
      .map((item) => `${item.quantity}× ${item.bundle.displayName}`)
      .join(', ');
  }
  /*async generateNewProductionProductVersion(
    products: Array<object>,
    authUser?: any,
  ) {
    const newArray: Array<object> = [];
    for (const item of products as any) {
      if (item.isBundle && item.isUseProduction) {
        const _costsum = item.bundleToProducts.reduce(
          (accumulator: any, currentObject: { cost: any }) => {
            return accumulator + currentObject.cost;
          },
          0,
        );
        const bunbleItemName = this.getBundleItemName(item.bundleToProducts);
        const branchToProducts = item.branchToProducts.filter(
          (e: any) => e.isAvailable === true,
        );
        if (branchToProducts.length > 0) {
          const bp = item.branchToProducts.find(
            (e: any) =>
              e.isAvailable === true && e.branchId === authUser.targetBranchId,
          );

          const newItem = {
            id: item.id,
            reference: item.reference,
            barreCode: item.barreCode,
            displayName: item.displayName,
            price: bp.price > 0 ? bp.price : item.price,
            cost: _costsum,
            sku: item.sku,
            branchToProducts: item.branchToProducts,
            isBundle: true,
            bunbleItemName: bunbleItemName,
            hasVariant: item.hasVariant,
            categoryName: item?.category.displayName,
            image: item.image,
            colorShape: item.colorShape,
            variantId: null,
            branchVariantToProducts: [],
          };

          newArray.push(newItem);
        }
      }
    }
    return newArray;
  }*/

  async generateNewProductionProductVersion(products: any[], authUser?: any) {
    const newArray: any[] = [];

    for (const item of products) {
      if (item.isBundle && item.isUseProduction) {
        // Calcul du coût total
        const totalCost =
          item.bundleToProducts?.reduce(
            (sum: number, curr: { cost: number }) => sum + (curr?.cost || 0),
            0,
          ) || 0;

        const bundleItemName = this.getBundleItemName(item.bundleToProducts);

        const branchToProducts =
          item.branchToProducts?.filter((e: any) => e.isAvailable === true) ||
          [];

        if (branchToProducts.length > 0) {
          const bp = branchToProducts.find(
            (e: any) => e.branchId === authUser?.targetBranchId,
          );

          if (bp) {
            newArray.push({
              id: item.id,
              reference: item.reference,
              barreCode: item.barreCode,
              displayName: item.displayName,
              price: bp.price > 0 ? bp.price : item.price,
              inStock: bp.inStock > 0 ? bp.inStock : 0,
              cost: totalCost,
              sku: item.sku,
              branchToProducts,
              isBundle: true,
              bunbleItemName: bundleItemName,
              hasVariant: item.hasVariant,
              categoryName: item?.category?.displayName,
              image: item.image,
              colorShape: item.colorShape,
              variantId: null,
              branchVariantToProducts: [],
            });
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

  async readOneRecord(options?: FindOneOptions<any>) {
    const entity = await this.repository.findOne(options);
    if (entity?.image) {
      const baseUrl = this.configService.get('APP_BASE_URL'); // Get base URL from config
      const _image = `${baseUrl}/${process.env.IMAGE_PATH}/${entity.image}`;
      entity.image = _image;
    }
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    if (entity.isBundle) {
      //const bunPrd: any[] = [];
      if (!entity.bundleToProducts) {
        const bdl: any = await this.getDetails(entity.id);
        entity.bundleToProducts = bdl.bundleToProducts;
      }

      /*for (const b of entity.bundleToProducts) {
        const item: any = { ...b };
        if (b.isVariant) {
          const variantName: any = await this.returnBundleItems(b.sku);
          item.name = `${b.bundle.displayName} (${variantName?.name ?? ''})`;
        } else {
          item.name = `${b.bundle.displayName}`;
        }
        bunPrd.push(item);
      }*/
      entity.bundleToProducts = await this._newBundleToProduct(
        entity.bundleToProducts,
      );
    }
    return entity as any;
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
            bundleToProducts: { bundle: true },
            branchToProducts: true,
          },
          bundle: true,
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
        (variant: { productId: any; sku: any }) =>
          //variant.productId === deliveryProductData.productId &&
          variant.sku == deliveryProductData.sku,
      );

      // 🔹 Étape 2 : Filtrer les stocks de la branche actuelle
      return variantList
        .flatMap(
          (variant: { branchVariantToProducts: any }) =>
            variant.branchVariantToProducts,
        ) // Récupère toutes les entrées `branchVariantToProducts`
        .filter(
          (branchVariant: { branchId: any; isAvailable: any }) =>
            branchVariant.branchId ===
              deliveryProductData.destinationBranchId &&
            branchVariant.isAvailable === true,
        )
        .reduce(
          (total: any, variant: { inStock: any }) => total + variant.inStock,
          0,
        );
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
      console.log('ddfdf20200522', deliveryProductData);

      // Produit simple, on récupère directement le stock dans la branche
      const branchProduct =
        product.branchToProducts &&
        product.branchToProducts.find(
          (branch: { branchId: any; productId: any; isAvailable: boolean }) =>
            branch.branchId === deliveryProductData.destinationBranchId &&
            branch.productId == deliveryProductData.productId &&
            branch.isAvailable === true,
        );
      return branchProduct ? branchProduct.inStock : 0;
    }
  }

  async verifyBundleProducts(bundleToProducts: any[]) {
    const newBundleToProducts: any[] = [];
    for (const item of bundleToProducts) {
      const __item: any = { ...item };
      // Chercher dans Product
      const foundProduct = await this.repository.findOne({
        where: { sku: item.sku, id: item.bundleId },
      });

      if (foundProduct && foundProduct?.isBundle) {
        // <=== vérifier ici !
        __item.isBundle = true;
        __item.isVariant = false;
      } else {
        const foundVariant = await this.variantRepository.findOne({
          where: { sku: item.sku, productId: item.bundleId },
        });

        if (foundVariant) {
          __item.isVariant = true;
          __item.isBundle = false;
        } else {
          __item.isBundle = false;
          __item.isVariant = false;
        }
      }
      newBundleToProducts.push(__item);
    }
    return newBundleToProducts;
  }

  async returnVariantBundleItems(bundleItem: { sku: any }) {
    // Chercher dans Product
    /* const foundProduct = await this.repository.findOne({
      where: { sku: bundleItem.sku id: bundleId  },
    });

    if (foundProduct.isBundle) {
      return foundProduct;
    } else {*/
    const foundVariant = await this.variantRepository.findOne({
      where: { sku: bundleItem.sku },
    });
    return foundVariant;
    //}
  }

  async _newBundleToProduct(bundleToProducts: any) {
    const bunPrd: any[] = [];
    for (const b of bundleToProducts) {
      const item: any = { ...b };
      if (b.isVariant) {
        const variantName: any = await this.returnVariantBundleItems(b);
        item.name = `${b.bundle.displayName}(${variantName?.name ?? ''})`;
      } else {
        item.name = `${b.bundle.displayName}`;
      }
      bunPrd.push(item);
    }
    return bunPrd;
  }
}
