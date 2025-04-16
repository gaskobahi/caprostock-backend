import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { SellingStatusEnum } from '../../definitions/enums';
import { AbstractService } from '../abstract.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { LockedException } from '@app/nestjs';
import { UpdateSellingDto } from 'src/core/dto/selling/update-selling.dto';
import { CreateSellingDto } from 'src/core/dto/selling/create-selling.dto';
import { Selling } from 'src/core/entities/selling/selling.entity';
import { ValidateSellingDto } from 'src/core/dto/selling/validate-selling.dto';
import { SellingToProduct } from 'src/core/entities/selling/selling-to-product.entity';
import { DeliveryService } from './delivery.service';

@Injectable()
export class SellingService extends AbstractService<Selling> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée`;

  constructor(
    @InjectRepository(Selling)
    private _repository: Repository<Selling>,
    protected paginatedService: PaginatedService<Selling>,
    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Selling> {
    return this._repository;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Selling>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  async myreadPaginatedListRecord(
    options?: FindManyOptions<Selling>,
    page: number = 1,
    perPage: number = 25,
  ) {
    /*console.log("perPage",options)
    // Paginate using provided options, page, and perPage
    const response = await this.paginatedService.paginate(
      this.repository,
      page,
      perPage,
      options,
    );*/
    const response = await this.readPaginatedListRecord(options);

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

    return response;
  }

  async createRecord(dto: DeepPartial<CreateSellingDto>): Promise<Selling> {
    const authUser = await super.checkSessionBranch();

    switch (dto?.action) {
      case SellingStatusEnum.draft:
        dto.status = SellingStatusEnum.draft;
        break;
      case SellingStatusEnum.pending:
        dto.status = SellingStatusEnum.pending;
        break;
      default:
        dto.status = SellingStatusEnum.pending;
    }

    // Check unique reference
    if (dto.reference) {
      await isUniqueConstraint(
        'reference',
        Selling,
        { reference: dto.reference },
        {
          message: `La référence "${dto.reference}" de la commande vente est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({
      ...dto,
      branchId: authUser.targetBranchId,
    });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Selling>,
    dto: DeepPartial<UpdateSellingDto>,
  ) {
    let entity = await this.repository.findOneBy(optionsWhere);
    if (!entity) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    entity = this.repository.merge(entity, dto);

    entity.updatedById = authUser?.id;
    // Adding this to trigger update events
    entity.updatedAt = new Date();
    return await super.updateRecord(optionsWhere, {
      ...entity,
    });
  }

  async readOneRecord(options?: FindOneOptions<Selling>) {
    const res = await this.repository.findOne(options);
    if (!res) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const entity = { ...res, totalAmount: 0, sellingId: res.id } as any;
    const {
      destinationBranchId,
      deliverys,
      sellingId,
      branchId,
      sellingToAdditionalCosts,
    } = entity;

    if (sellingToAdditionalCosts) {
      for (const al of sellingToAdditionalCosts) {
        if (al.deliveryToAdditionalCosts.length > 0) {
          al.hasDeliveryToAdditionalCost = true;
        } else {
          al.hasDeliveryToAdditionalCost = false;
        }
      }

      if (entity.status == SellingStatusEnum.closed) {
        for (const al of entity?.sellingToAdditionalCosts) {
          if (!al.deliveryToAdditionalCosts.length) {
            al.isCancelled = true;
          }
        }
      }
    }

    const newSellingToProducts = entity?.sellingToProducts?.reduce(
      (
        acc: {
          productId: any;
          quantity: any;
          incoming: any;
          isDelivery: boolean;
          cost: any;
          amount: number;
          inStock: number;
          variantId: any;
          hasVariant: any;
          displayName: string;
          equipmentId: string;
          sku: any;
          equipmentName: string;
        }[],
        {
          productId,
          quantity,
          cost,
          product: item,
          sku,
          equipmentId,
          equipment,
        }: any,
      ) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts?.filter(
            (v: { sku: any }) => v.sku === sku,
          );
          const incoming = this.sumQuantitiesDeliveryBySKU(
            deliverys,
            sellingId,
            branchId,
            sku,
          );
          const isDelivery = this.isLineDelivery(quantity, incoming);
          variants?.forEach(
            (vp: { branchVariantToProducts: any[]; id: any; name: any }) => {
              const dstbranchVariants = vp.branchVariantToProducts.find(
                (bvp: { branchId: any }) =>
                  bvp.branchId === destinationBranchId,
              );
              if (dstbranchVariants) {
                acc.push({
                  productId: productId,
                  quantity: quantity,
                  incoming: incoming ?? 0,
                  isDelivery: isDelivery,
                  cost: cost,
                  amount:
                    parseInt(cost.toString()) * parseInt(quantity.toString()),
                  inStock: parseInt(dstbranchVariants.inStock.toString()),
                  //+parseInt(quantity.toString()),
                  variantId: vp.id,
                  hasVariant: item?.hasVariant,
                  displayName: `${item?.displayName} (${vp?.name})`,
                  sku: sku,
                  equipmentId: equipmentId,
                  equipmentName: equipment ? equipment.displayName : '',
                });
              }
            },
          );
        } else {
          const srcbranchProducts = item.branchToProducts.find(
            (bp: { branchId: any }) => bp.branchId === destinationBranchId,
          );
          const incoming = this.sumQuantitiesDeliveryBySKU(
            deliverys,
            sellingId,
            branchId,
            sku,
          );
          const isDelivery = this.isLineDelivery(quantity, incoming);
          if (srcbranchProducts) {
            acc.push({
              productId: productId,
              quantity: quantity,
              incoming: incoming,
              isDelivery: isDelivery,
              cost: cost,
              amount: parseInt(cost.toString()) * parseInt(quantity.toString()),
              hasVariant: item.hasVariant,
              inStock: parseInt(srcbranchProducts.inStock.toString()),
              // - parseInt(quantity.toString()),
              displayName: `${item.displayName}`,
              sku: sku,
              variantId: null,
              equipmentId: equipmentId,
              equipmentName: equipment ? equipment.displayName : '',
            });
          }
        }
        return acc;
      },
      [],
    );

    entity.sellingToProducts = newSellingToProducts;
    entity.totalSellinged = this.totalSellinged(entity);
    entity.totalDelivery = this.totalDelivery(entity);
    entity.totalAmount = this.totalAmount(entity);
    entity.hasIncoming = this.hasIncoming(entity);
    entity.isAlldelivery = this.isAllDelivery(entity?.sellingToProducts);
    return entity;
  }

  /*async cancelRecord(
    optionsWhere: FindOptionsWhere<Selling>,
    status: SellingStatusEnum,
    dto: ValidateSellingDto,
  ) {
    const selling = await this._repository.findOne({
      where: optionsWhere,
      relations: {
        destinationBranch: true,
        sellingToProducts: {
          product: true,
        },
      },
    });
    if (!selling) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    // Vérifier que la commande est disponible pour validation
    if (selling.isClosed) {
      throw new LockedException(
        `Cette opération n'est plus possible, la commande est déjà clôturée`,
      );
    }

    selling.remark = dto.remark;
    selling.status = status;

    selling.updatedById = authUser?.id;
    selling.validatedById = authUser?.id;
    selling.validatedAt = new Date();

    return await this.repository.save(selling);
  }*/

  sumQuantitiesDeliveryBySKU = (
    deliverys: any[],
    sellingId: any,
    branchId: any,
    sku: any,
  ) => {
    return deliverys
      .filter(
        (delivery: {
          sellingId: any;
          branchId: any;
          status: SellingStatusEnum;
        }) =>
          delivery.sellingId === sellingId &&
          delivery.branchId === branchId &&
          delivery.status === SellingStatusEnum.closed,
      )
      .reduce((sum: any, delivery: { deliveryToProducts: any[] }) => {
        const skuQuantity = delivery.deliveryToProducts
          .filter((product: { sku: any }) => product.sku === sku)
          .reduce(
            (acc: any, product: { quantity: any }) => acc + product.quantity,
            0,
          );
        return sum + skuQuantity;
      }, 0);
  };

  isAllDelivery = (sellingToProducts: any = []) => {
    return sellingToProducts.every(
      (product: { quantity: number; incoming: number }) =>
        product.quantity - product.incoming <= 0,
    );
  };

  isAllDeliveryv2(
    sellingToProducts: SellingToProduct[],
    delivered: Record<string, number>,
  ): boolean {
    for (const otp of sellingToProducts) {
      const sellingedQty = otp.quantity;
      const deliveredQty = delivered[otp.productId] || 0;

      if (deliveredQty < sellingedQty) {
        return false; // Produit pas encore totalement livré
      }
    }
    return true; // Tous les produits sont reçus
  }

  //apply this on update selling
  _isLineIncomingMoreThanQuantity(quantity: number, incoming: number) {
    return quantity < incoming;
  }
  isLineDelivery(quantity: number, incoming: number) {
    return quantity - incoming <= 0;
  }

  isLineIncomingMoreThanQuantity = (sellingToProducts: string | any[]) => {
    for (let i = 0; i < sellingToProducts.length; i++) {
      if (sellingToProducts[i].quantity < sellingToProducts[i].incoming) {
        throw new BadRequestException(
          `La quantité ${sellingToProducts[i].quantity} ne peut être inférieur à la quantité récue ${sellingToProducts[i].incoming}`,
        );
      }
    }
    return true;
  };

  hasIncoming(entity: { sellingToProducts: any[] }) {
    if (!entity?.sellingToProducts) {
      return false;
    }
    return entity.sellingToProducts.some(
      (product: { incoming: number }) => product.incoming > 0,
    );
  }

  totalAmount(entity: any): number {
    if (!entity?.sellingToProducts) {
      return 0;
    }
    const totalOrdAMOUNT = entity.sellingToProducts.reduce(
      (acc, { quantity = 0, cost = 0 }) => acc + quantity * cost,
      0,
    );
    const totalAddAMOUNT =
      entity.sellingToAdditionalCosts?.reduce(
        (acc, { amount = 0 }) => acc + amount,
        0,
      ) || 0;
    return totalOrdAMOUNT + totalAddAMOUNT;
  }

  totalDelivery(entity: { sellingToProducts: any[] }) {
    if (!entity?.sellingToProducts) {
      return 0;
    }
    return entity?.sellingToProducts?.reduce(
      (acc: any, current: { incoming: any }) => acc + (current.incoming || 0),
      0,
    );
  }

  totalSellinged(entity: { sellingToProducts: any[] }) {
    if (!entity?.sellingToProducts) {
      return 0;
    }
    return entity?.sellingToProducts?.reduce(
      (acc: any, current: { quantity: any }) => acc + (current.quantity || 0),
      0,
    );
  }

  async getDetails(sellingId: string) {
    return await this.readOneRecord({
      where: { id: sellingId },
      relations: {
        sellingToProducts: {
          product: {
            variantToProducts: { branchVariantToProducts: true },
            branchToProducts: true,
          },
        },
        deliverys: { deliveryToProducts: true },
        sellingToAdditionalCosts: { deliveryToAdditionalCosts: true },
      },
    });
  }

  async cancelRecord(optionsWhere: FindOptionsWhere<Selling>) {
    // Récupérer la demande
    const selling = await this.readOneRecord({
      where: optionsWhere,
      relations: {
        sellingToProducts: {
          product: {
            variantToProducts: { branchVariantToProducts: true },
            branchToProducts: true,
          },
        },
        deliverys: { deliveryToProducts: true },
      },
    });

    if (!selling) {
      throw new NotFoundException(['Commande introuvable.']);
    }

    // Vérifier s'il existe au moins une réception en statut "closed"

    const closedDeliverys =
      await this.deliveryService.existClosedRecordBySellingId(selling.id);

    if (closedDeliverys) {
      throw new BadRequestException([
        "Impossible d'annuler cette demande car elle contient déjà des livraisons validées.",
      ]);
    }

    const deliverys = selling.deliverys;

    // Annuler toutes les réceptions en pending (si tu veux les conserver comme trace logique, change juste le statut)
    for (const delivery of deliverys ?? []) {
      await this.deliveryService.updateRecord(
        {
          ...optionsWhere,
          id: delivery?.id,
          //status: SellingStatusEnum.pending,
        },
        { status: SellingStatusEnum.canceled },
      );
    }

    // Mettre à jour le statut de la commande
    await this.updateRecord(optionsWhere, {
      status: SellingStatusEnum.canceled,
    });
  }
}
