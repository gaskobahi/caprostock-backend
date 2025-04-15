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
import { Order } from '../../entities/stockmanagement/order.entity';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { CreateOrderDto } from '../../dto/stockmanagement/create-order.dto';
import { OrderStatusEnum } from '../../definitions/enums';
import { AbstractService } from '../abstract.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { UpdateOrderDto } from 'src/core/dto/stockmanagement/update-order.dto';
import { OrderToProduct } from 'src/core/entities/stockmanagement/order-to-product.entity';
import { ReceptionService } from './reception.service';

@Injectable()
export class OrderService extends AbstractService<Order> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée`;

  constructor(
    @InjectRepository(Order)
    private _repository: Repository<Order>,
    protected paginatedService: PaginatedService<Order>,
    @Inject(forwardRef(() => ReceptionService))
    private receptionService: ReceptionService,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Order> {
    return this._repository;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Order>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  async myreadPaginatedListRecord(
    options?: FindManyOptions<Order>,
    page: number = 1,
    perPage: number = 25,
  ) {
    // Paginate using provided options, page, and perPage
    /*const response = await this.paginatedService.paginate(
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

  async createRecord(dto: DeepPartial<CreateOrderDto>): Promise<Order> {
    const authUser = await super.checkSessionBranch();

    switch (dto?.action) {
      case OrderStatusEnum.draft:
        dto.status = OrderStatusEnum.draft;
        break;
      case OrderStatusEnum.pending:
        dto.status = OrderStatusEnum.pending;
        break;
      default:
        dto.status = OrderStatusEnum.pending;
    }

    // Check unique reference
    if (dto.reference) {
      await isUniqueConstraint(
        'reference',
        Order,
        { reference: dto.reference },
        {
          message: `La référence "${dto.reference}" de la commande est déjà utilisée`,
        },
      );
    }

    return await super.createRecord({
      ...dto,
      branchId: authUser.targetBranchId,
    });
  }

  async updateRecord(
    optionsWhere: FindOptionsWhere<Order>,
    dto: DeepPartial<UpdateOrderDto>,
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

  async readOneRecord(options?: FindOneOptions<Order>) {
    const res = await this.repository.findOne(options);
    if (!res) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const entity = { ...res, totalAmount: 0, orderId: res.id } as any;
    const {
      destinationBranchId,
      receptions,
      orderId,
      branchId,
      orderToAdditionalCosts,
    } = entity;

    if (orderToAdditionalCosts) {
      for (const al of orderToAdditionalCosts) {
        if (al.receptionToAdditionalCosts.length > 0) {
          al.hasReceptionToAdditionalCost = true;
        } else {
          al.hasReceptionToAdditionalCost = false;
        }
      }

      if (entity.status == OrderStatusEnum.closed) {
        for (const al of entity?.orderToAdditionalCosts) {
          if (!al.receptionToAdditionalCosts.length) {
            al.isCancelled = true;
          }
        }
      }
    }

    const newOrderToProducts = entity?.orderToProducts?.reduce(
      (
        acc: {
          productId: any;
          quantity: any;
          incoming: any;
          isReceived: boolean;
          cost: any;
          amount: number;
          inStock: number;
          variantId: any;
          hasVariant: any;
          displayName: string;
          sku: any;
        }[],
        { productId, quantity, cost, product: item, sku }: any,
      ) => {
        if (item.hasVariant) {
          const variants = item.variantToProducts?.filter(
            (v: { sku: any }) => v.sku === sku,
          );
          const incoming = this.sumQuantitiesReceptionBySKU(
            receptions,
            orderId,
            branchId,
            sku,
          );
          const isReceived = this.isLineReceived(quantity, incoming);
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
                  isReceived: isReceived,
                  cost: cost,
                  amount:
                    parseInt(cost.toString()) * parseInt(quantity.toString()),
                  inStock: parseInt(dstbranchVariants.inStock.toString()),
                  //+parseInt(quantity.toString()),
                  variantId: vp.id,
                  hasVariant: item?.hasVariant,
                  displayName: `${item?.displayName} (${vp?.name})`,
                  sku: sku,
                });
              }
            },
          );
        } else {
          const srcbranchProducts = item.branchToProducts.find(
            (bp: { branchId: any }) => bp.branchId === destinationBranchId,
          );
          const incoming = this.sumQuantitiesReceptionBySKU(
            receptions,
            orderId,
            branchId,
            sku,
          );
          const isReceived = this.isLineReceived(quantity, incoming);
          if (srcbranchProducts) {
            acc.push({
              productId: productId,
              quantity: quantity,
              incoming: incoming,
              isReceived: isReceived,
              cost: cost,
              amount: parseInt(cost.toString()) * parseInt(quantity.toString()),
              hasVariant: item.hasVariant,
              inStock: parseInt(srcbranchProducts.inStock.toString()),
              // - parseInt(quantity.toString()),
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
    //const totalReceived = this.receptionService.calculateTotalReceived(otherReceptions);

    entity.orderToProducts = newOrderToProducts;
    entity.totalOrdered = this.totalOrdered(entity);
    entity.totalReceived = this.totalReceived(entity);
    entity.totalAmount = this.totalAmount(entity);
    entity.hasIncoming = this.hasIncoming(entity);
    entity.isAllreceived = this.isAllReceive(
      entity?.orderToProducts,
      //entity?.reception?.receptionToProducts,
    );
    return entity;
  }
  

  sumQuantitiesReceptionBySKU = (
    receptions: any[],
    orderId: any,
    branchId: any,
    sku: any,
  ) => {
    return receptions
      .filter(
        (reception: { orderId: any; branchId: any; status: OrderStatusEnum }) =>
          reception.orderId === orderId &&
          reception.branchId === branchId &&
          reception.status == OrderStatusEnum.closed,
      )
      .reduce((sum: any, reception: { receptionToProducts: any[] }) => {
        const skuQuantity = reception.receptionToProducts
          .filter((product: { sku: any }) => product.sku === sku)
          .reduce(
            (acc: any, product: { quantity: any }) => acc + product.quantity,
            0,
          );
        return sum + skuQuantity;
      }, 0);
  };

  isAllReceive = (orderToProducts: any = []) => {
    return orderToProducts.every(
      (product: { quantity: number; incoming: number }) =>
        product.quantity - product.incoming <= 0,
    );
  };

  isAllReceivev2(
    orderToProducts: OrderToProduct[],
    received: Record<string, number>,
  ): boolean {
    for (const otp of orderToProducts) {
      const orderedQty = otp.quantity;
      const receivedQty = received[otp.productId] || 0;

      if (receivedQty < orderedQty) {
        return false; // Produit pas encore totalement livré
      }
    }
    return true; // Tous les produits sont reçus
  }

  //apply this on update order
  _isLineIncomingMoreThanQuantity(quantity: number, incoming: number) {
    return quantity < incoming;
  }
  isLineReceived(quantity: number, incoming: number) {
    return quantity - incoming <= 0;
  }

  isLineIncomingMoreThanQuantity = (orderToProducts: string | any[]) => {
    for (let i = 0; i < orderToProducts.length; i++) {
      if (orderToProducts[i].quantity < orderToProducts[i].incoming) {
        throw new BadRequestException(
          `La quantité ${orderToProducts[i].quantity} ne peut être inférieur à la quantité récue ${orderToProducts[i].incoming}`,
        );
      }
    }
    return true;
  };

  hasIncoming(entity: { orderToProducts: any[] }) {
    if (!entity?.orderToProducts) {
      return false;
    }
    return entity.orderToProducts.some(
      (product: { incoming: number }) => product.incoming > 0,
    );
  }

  totalAmount(entity: any): number {
    if (!entity?.orderToProducts) {
      return 0;
    }
    const totalOrdAMOUNT = entity.orderToProducts.reduce(
      (acc, { quantity = 0, cost = 0 }) => acc + quantity * cost,
      0,
    );
    const totalAddAMOUNT =
      entity.orderToAdditionalCosts?.reduce(
        (acc, { amount = 0 }) => acc + amount,
        0,
      ) || 0;
    return totalOrdAMOUNT + totalAddAMOUNT;
  }

  totalReceived(entity: { orderToProducts: any[] }) {
    if (!entity?.orderToProducts) {
      return 0;
    }
    return entity?.orderToProducts?.reduce(
      (acc: any, current: { incoming: any }) => acc + (current.incoming || 0),
      0,
    );
  }

  totalOrdered(entity: { orderToProducts: any[] }) {
    if (!entity?.orderToProducts) {
      return 0;
    }
    return entity?.orderToProducts?.reduce(
      (acc: any, current: { quantity: any }) => acc + (current.quantity || 0),
      0,
    );
  }

  /* async updateStocks(dto: any): Promise<void> {
    console.log('tot1', dto);
    for (const ps of dto.orderToProducts) {
      const prd = await this.productService.getDetails(ps.productId);

      if (prd.hasVariant) {
        await this.updateVariantStock(prd.variantToProducts, ps, dto);
      } else {
        await this.updateProductStock(prd.branchToProducts, ps, dto);
      }
    }
  }

  private async updateVariantStock(
    variants: any[],
    ps: { sku: any; quantity: number },
    dto: any,
  ): Promise<void> {
    const vp = variants.find((el: { sku: any }) => el.sku === ps.sku);

    if (!vp) return;

    const srcProductBranch = vp.branchVariantToProducts.find(
      (el: { branchId: any; sku: any }) =>
        el.branchId === dto.destinationBranchId && el.sku === vp.sku,
    );

    if (srcProductBranch) {
      await this.branchVariantToProductService.updateRecord(
        { sku: vp.sku, branchId: dto.destinationBranchId },
        { inStock: srcProductBranch.inStock - ps.quantity },
      );
    }
  }
  private async updateProductStock(
    branchToProducts: any, //branchToProducts,
    porders: { productId: any; quantity: any },
    dto: any,
  ): Promise<void> {
    const currentBranchStock = branchToProducts.find(
      (el: { productId: any; branchId: any }) =>
        el.productId === porders.productId &&
        el.branchId === dto.destinationBranchId,
    );

    await this.branchToProductService.updateRecord(
      {
        productId: porders.productId,
        branchId: dto.destinationBranchId,
      },
      { inStock: currentBranchStock.inStock + porders.quantity },
    );
  }*/

  async getDetails(orderId: string) {
    return await this.readOneRecord({
      where: { id: orderId },
      relations: {
        orderToProducts: {
          product: {
            variantToProducts: { branchVariantToProducts: true },
            branchToProducts: true,
          },
        },
        receptions: { receptionToProducts: true },
        orderToAdditionalCosts: { receptionToAdditionalCosts: true },
      },
    });
  }

  async cancelRecord(optionsWhere: FindOptionsWhere<Order>) {
    // Récupérer la commande
    const order = await this.readOneRecord({
      where: optionsWhere,
      relations: {
        orderToProducts: {
          product: {
            variantToProducts: { branchVariantToProducts: true },
            branchToProducts: true,
          },
        },
        receptions: { receptionToProducts: true },
      },
    });

    if (!order) {
      throw new NotFoundException(['Commande introuvable.']);
    }

    // Vérifier s'il existe au moins une réception en statut "closed"

    const closedReceptions =
      await this.receptionService.existClosedRecordByOrderId(order.id);

    if (closedReceptions) {
      throw new BadRequestException(
        "Impossible d'annuler cette commande car elle contient déjà des réceptions validées.",
      );
    }

    const receptions = order.receptions;

    // Annuler toutes les réceptions en pending (si tu veux les conserver comme trace logique, change juste le statut)
    for (const reception of receptions ?? []) {
      await this.receptionService.updateRecord(
        { ...optionsWhere, id: reception?.id, status: OrderStatusEnum.pending },
        { status: OrderStatusEnum.canceled },
      );
    }

    // Mettre à jour le statut de la commande
    await this.updateRecord(optionsWhere, {
      status: OrderStatusEnum.canceled,
    });

    /*return {
      success: true,
      message: `Commande ${order.reference} annulée avec succès.`,
    };*/
  }
}
