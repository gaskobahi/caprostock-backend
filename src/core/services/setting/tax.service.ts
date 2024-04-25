import {
  PaginatedService,
  isUniqueConstraint,
  isUniqueConstraintUpdate,
} from '@app/typeorm';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Tax } from '../../entities/setting/tax.entity';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { ConfigService } from '../system/config.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { UpdateTaxDto } from 'src/core/dto/setting/update-tax.dto';
import { CreateTaxDto } from 'src/core/dto/setting/create-tax.dto';
import { ProductService } from '../product/product.service';
import { TaxToProductService } from '../product/tax-to-product.service';
import { TaxOptionEnum } from 'src/core/definitions/enums';

@Injectable()
export class TaxService extends AbstractService<Tax> {
  public NOT_FOUND_MESSAGE = `Produit non trouvé`;

  constructor(
    @InjectRepository(Tax)
    private _repository: Repository<Tax>,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    private taxToProductService: TaxToProductService,
    private readonly configService: ConfigService,

    protected paginatedService: PaginatedService<Tax>,
    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Tax> {
    return this._repository;
  }

  async createRecord(dto: CreateTaxDto): Promise<Tax> {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraint(
        'displaName',
        Tax,
        { displayName: dto.displayName },
        {
          message: `La nom "${dto.displayName}" est déjà utilisée`,
        },
      );
    }

    if (!dto.hasDining) {
      dto.diningToTaxs = [];
    }
    console.log('BORIS20022', dto);
    const result = await super.createRecord({ ...dto });

    if (result) {
      if (result.option) {
        //get la liste des produits
        const products = await this.productService.readListRecord();
        for (const product of products) {
          const newProductDto: any = [
            { productId: product.id, taxId: result.id, isEnable: false },
          ];
          await this.taxToProductService.repository.save(newProductDto);
        }
      }
    }

    return result;
  }

  async updateRecord(optionsWhere: FindOptionsWhere<Tax>, dto: UpdateTaxDto) {
    // Check unique displayName
    if (dto.displayName) {
      await isUniqueConstraintUpdate(
        'displayName',
        Tax,
        { displayName: dto.displayName, id: optionsWhere.id },
        { message: `Le nom "${dto.displayName}" est déjà utilisé` },
      );
    }

    if (!dto.hasDining) {
      dto.diningToTaxs = [];
    }
    console.log('YYYYYYYY',dto)
    const result = await super.updateRecord(optionsWhere, {
      ...dto,
    });
    if (
      result.option == TaxOptionEnum.applyToExitingItems ||
      result.option == TaxOptionEnum.applyToNewAndExitingItems
    ) {
      //get la liste des produits
      const products = await this.productService.readListRecord({
        relations: { taxToProducts: true },
      });
      for (const product of products) {
        const newProductDto: any = {
          productId: product.id,
          taxId: result.id,
          isEnable: true,
        };
        // verifier que cette ligne n'existe pas dans la table taxToProduct
        const isExistIntoTaxToProduct =
          await this.taxToProductService.repository.countBy({
            taxId: result.id,
            productId: product.id,
          });

        if (isExistIntoTaxToProduct > 0) {
          //update
          await this.taxToProductService.repository.update(
            { productId: product.id, taxId: result.id },
            newProductDto,
          );
          //}
        } else {
          //create
          console.log('ZAZAAZAAZA', isExistIntoTaxToProduct);
          await this.taxToProductService.repository.save(newProductDto);
        }
      }
    } else {
      const isExistIntoTaxToProduct2 =
        await this.taxToProductService.repository.countBy({
          taxId: result.id,
        });

      if (isExistIntoTaxToProduct2) {
        await this.taxToProductService.repository.delete({ taxId: result.id });
      }
    }

    return result;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Tax>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchToTaxs: {
          branchId: authUser.targetBranchId,
        },
      };
    }

    return {};
  }

  async readOneRecord(options?: FindOneOptions<Tax>) {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    return entity;
  }

  async deleteRecord(optionsWhere: FindOptionsWhere<Tax>) {
    const entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    entity.updatedById = authUser?.id;
    entity.deletedById = authUser?.id;
    return await this.repository.remove(entity);
  }
}
