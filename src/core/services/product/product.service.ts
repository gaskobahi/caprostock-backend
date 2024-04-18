import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
  removeImage,
} from '@app/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import * as fs from 'file-system';
import { ProductsymbolTypeEnum } from 'src/core/definitions/enums';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';

@Injectable()
export class ProductService extends AbstractService<Product> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé`;

  constructor(
    @InjectRepository(Product)
    private _repository: Repository<Product>,
    private readonly configService: ConfigService,
    protected paginatedService: PaginatedService<Product>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Product> {
    return this._repository;
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

    return await super.createRecord({ ...dto, isActive: true });
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
}
