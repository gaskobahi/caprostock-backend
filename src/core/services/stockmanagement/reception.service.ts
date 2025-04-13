import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import { DeepPartial, Equal, FindOptionsWhere, Not, Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { CreateReceptionDto } from 'src/core/dto/stockmanagement/create-reception.dto';
import { OrderService } from './order.service';
import { OrderStatusEnum } from 'src/core/definitions/enums';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';
import { VariantToProductService } from '../subsidiary/variant-to-product.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';

@Injectable()
export class ReceptionService extends AbstractService<Reception> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée`;

  constructor(
    @InjectRepository(Reception)
    private _repository: Repository<Reception>,
    protected paginatedService: PaginatedService<Reception>,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,

    private branchToProductService: BranchToProductService,
    private readonly branchVariantToProductService: BranchVariantToProductService,
    private readonly productService: ProductService,
    private readonly variantToProductService: VariantToProductService,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Reception> {
    return this._repository;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Reception>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  async createRecord(dto: DeepPartial<CreateReceptionDto>): Promise<Reception> {
    const authUser = await super.checkSessionBranch();

    if (dto.reference) {
      await isUniqueConstraint(
        'reference',
        Reception,
        { reference: dto.reference },
        {
          message: `La référence "${dto.reference}" de la réception est déjà utilisée`,
        },
      );
    }

    let response: Reception;

    try {
      // Création de la réception
      response = await super.createRecord({
        ...dto,
        branchId: authUser.targetBranchId,
      });

      // Récupération des détails de la commande
      const orderDetails = await this.orderService.getDetails(dto.orderId);
      if (!orderDetails)
        throw new BadRequestException(['Commande introuvable']);

      // Vérification si toute la commande est reçue
     /* const isAllReceive = this.orderService.isAllReceive(
        orderDetails?.orderToProducts,
      );*/

      // Mise à jour des stocks
      /*for (const receptionToProduct of dto.receptionToProducts) {
        const receptionProductData = {
          ...receptionToProduct,
          destinationBranchId: orderDetails.destinationBranchId,
          orderId: dto.orderId,
        };
        await this.updateStocks(receptionProductData);
      }*/

      // Mise à jour du statut de la commande
      /*await this.orderService.updateRecord(
        { id: orderDetails.id },
        {
          status: isAllReceive
            ? OrderStatusEnum.closed
            : OrderStatusEnum.partialreceived,
        },
      );*/

      return response;
    } catch (error) {
      // En cas d'erreur, suppression de la réception créée
      if (response?.id) {
        await this.deleteRecord({ id: response.id });
      }
      // Journaliser l'erreur et la relancer
      throw new BadRequestException([
        "Une erreur est survenue lors de la création de la réception. L'opération a été annulée.",
      ]);
    }
  }

  getDetailByOrderId = async (orderId: string) => {
    return await this.orderService.readOneRecord({
      where: { id: orderId },
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
  };

  async updateStocks(receptionProductData: any): Promise<void> {
    const prd = await this.productService.getDetails(
      receptionProductData.productId,
    );
    if (receptionProductData.orderId) {
      const orderData = await this.getDetailByOrderId(
        receptionProductData.orderId,
      );

      //update item product cost

      if (orderData && orderData.orderToProducts) {
        await this.updateProductCost(
          orderData.orderToProducts,
          receptionProductData,
        );
      }
    }

    //update product stock
    if (prd.hasVariant) {
      await this.updateVariantStock(
        prd.variantToProducts,
        receptionProductData,
      );
    } else {
      await this.updateProductStock(prd.branchToProducts, receptionProductData);
    }
  }

  /*async updateStocksV2(receptionProductData: any): Promise<void> {
    const prd = await this.productService.getDetails(
      receptionProductData.productId,
    );
    const orderData = await this.getDetailByOrderId(
      receptionProductData.orderId,
    );

    //update item product cost

    if (orderData && orderData.orderToProducts) {
      await this.updateProductCost(
        orderData.orderToProducts,
        receptionProductData,
      );
    }

    //update product stock
    if (prd.hasVariant) {
      await this.updateVariantStock(
        prd.variantToProducts,
        receptionProductData,
      );
    } else {
      await this.updateProductStock(prd.branchToProducts, receptionProductData);
    }
  }*/

  private async updateVariantStock(variants: any[], dto: any): Promise<void> {
    const vp = variants.find((el: { sku: any }) => el.sku === dto.sku);

    if (!vp) return;

    const srcProductBranch = vp.branchVariantToProducts.find(
      (el: { branchId: any; sku: any }) =>
        el.branchId === dto.destinationBranchId && el.sku === vp.sku,
    );

    if (srcProductBranch) {
      await this.branchVariantToProductService.updateRecord(
        { sku: srcProductBranch.sku, branchId: dto.destinationBranchId },
        { inStock: srcProductBranch.inStock + dto.quantity },
      );
    }
  }

  private async updateProductStock(
    branchToProducts: any, //branchToProducts,
    dto: any,
  ): Promise<void> {
    const currentBranchStock = branchToProducts.find(
      (el: { productId: any; branchId: any }) =>
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

  private async updateProductCost(
    arrayToProducts: any,
    receptionProductData: any,
  ): Promise<void> {
    for (const oproduct of arrayToProducts ?? []) {
      //consider received quantity more that 0
      if (
        oproduct.sku == receptionProductData.sku &&
        receptionProductData.quantity > 0
      ) {
        if (oproduct.variantId) {
          await this.variantToProductService.updateRecord(
            {
              id: oproduct.variantId,
              productId: oproduct.productId,
              sku: oproduct.sku,
            },
            { cost: oproduct.cost },
          );
        } else {
          await this.productService.updateRecord(
            {
              id: oproduct.productId,
            },
            { cost: oproduct.cost },
          );
        }
      }
    }
  }

  private async cancelOrderWithReceptionRollback(
    orderId: string,
  ): Promise<void> {
    // 1. Récupérer la commande et vérifier qu'elle peut être annulée
    const order = await this.orderService.getDetails(orderId);
    if (!order) throw new BadRequestException(['Commande introuvable']);

    if (order.status === OrderStatusEnum.closed) {
      throw new BadRequestException([
        "Impossible d'annuler une commande déjà clôturée.",
      ]);
    }

    // 2. Récupérer toutes les réceptions liées à la commande
    const receptions = await this.repository.find({
      where: { orderId },
      relations: ['receptionToProducts'],
    });

    for (const reception of receptions) {
      // 3. Pour chaque produit réceptionné, faire un "retour stock"
      for (const rtp of reception.receptionToProducts) {
        await this.rollbackStock({
          productId: rtp.productId,
          quantity: rtp.quantity,
          branchId: reception.branchId,
          receptionId: reception.id,
        });
      }

      // 4. Supprimer ou marquer la réception comme annulée
      await this.repository.delete(reception.id);
    }

    // 5. Changer le statut de la commande
    await this.orderService.updateRecord(
      { id: orderId },
      { status: OrderStatusEnum.canceled },
    );
  }

  private async rollbackStock({ productId, quantity, branchId, receptionId }) {
    // Tu peux soit diminuer le stock, soit créer un mouvement "sortie"
    const currentStock = await this.productService.getBranchStock(
      productId,
      branchId,
    );

    /*if (currentStock.quantity < quantity) {
      throw new Error(
        `Stock insuffisant pour annuler la réception ${receptionId}`,
      );
    }*/

    // Mise à jour
    //await this.stockService.updateQuantity(productId, branchId, -quantity);

    // Journaliser le mouvement
    /*await this.stockMovementsService.create({
      productId,
      branchId,
      quantity: -quantity,
      type: 'RETOUR_RECEPTION',
      reference: `Annulation réception ${receptionId}`,
    });*/
    return;
  }

  async cancel(option: any): Promise<any> {
    const reception = await this.readOneRecord({
      relations: {
        receptionToProducts: { product: true },
        order: { orderToProducts: true },
        receptionToAdditionalCosts: true,
      },
      where: option,
    });

    if (!reception) throw new BadRequestException('Réception introuvable');
    // Vérifier si déjà annulée
    if (reception.status === OrderStatusEnum.canceled) {
      throw new BadRequestException('Réception déjà annulée');
    }

    if (reception.status == OrderStatusEnum.closed) {
      // Mise à jour des stocks Inverser les effets sur le stock
      for (const receptionToProduct of reception.receptionToProducts) {
        const receptionProductData = {
          ...receptionToProduct,
          quantity: -receptionToProduct.quantity,
          orderId: '',
          destinationBranchId: reception.branchId,
        };
        await this.updateStocks(receptionProductData);
      }
    }

    // 2. Marquer la réception comme annulée (ou la supprimer)
    await this.updateRecord(
      { id: reception.id },
      { status: OrderStatusEnum.canceled },
    );
    // 3. Recalculer le statut de la commande liée
    await this.recalculerOrderStatus(reception);
    /*const order = reception.order;
    const otherReceptions = await this.readListRecord({
      where: {
        orderId: order.id,
        status: Not(OrderStatusEnum.canceled),
      },
      relations: { receptionToProducts: true },
    });

    const totalReceived = this.calculateTotalReceived(otherReceptions);

    const isAllReceived = this.orderService.isAllReceivev2(
      order.orderToProducts,
      totalReceived,
    );

    let newStatus: OrderStatusEnum;

    const totalReceivedQuantities = Object.values(totalReceived).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );

    if (totalReceivedQuantities === 0) {
      newStatus = OrderStatusEnum.pending; // ou 'open'
    } else if (isAllReceived) {
      newStatus = OrderStatusEnum.closed;
    } else {
      newStatus = OrderStatusEnum.partialreceived;
    }
    await this.orderService.updateRecord(
      { id: order.id },
      { status: newStatus },
    );*/

    const entity = await this.repository.findOneBy({ id: reception.id });
    if (entity.status == OrderStatusEnum.canceled) {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      entity.canceledById = authUser?.id;
      entity.canceledAt = new Date();
      await this.repository.update(option, entity);
    }
  }

  async closed(option: any): Promise<any> {
    const reception = await this.readOneRecord({
      relations: {
        receptionToProducts: { product: true },
        order: { orderToProducts: true },
        receptionToAdditionalCosts: true,
      },
      where: option,
    });

    if (!reception) throw new BadRequestException(['Réception introuvable']);
    // Vérifier si déjà annulée
    if (reception.status === OrderStatusEnum.closed) {
      throw new BadRequestException(['Réception déjà cloturée']);
    }
    if (reception.status === OrderStatusEnum.canceled) {
      throw new BadRequestException([
        'impossible de cloturé reception annulée',
      ]);
    }

    // Mise à jour des stocks
    for (const receptionToProduct of reception.receptionToProducts) {
      const receptionProductData = {
        ...receptionToProduct,
        destinationBranchId: reception.branchId,
        orderId: reception.orderId,
      };
      await this.updateStocks(receptionProductData);
    }

    // 2. Marquer la réception comme cloturee
    await this.updateRecord(
      { id: reception.id },
      { status: OrderStatusEnum.closed },
    );

    // 3. Recalculer le statut de la commande liée
    await this.recalculerOrderStatus(reception);

    const entity = await this.repository.findOneBy({ id: reception.id });
    if (entity.status == OrderStatusEnum.closed) {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      entity.closedById = authUser?.id;
      entity.closedAt = new Date();
      await this.repository.update(option, entity);
    }
  }

  calculateTotalReceived(receptions: Reception[]): Record<string, number> {
    const totalReceived: Record<string, number> = {};
    for (const reception of receptions) {
      for (const rtp of reception.receptionToProducts) {
        if (!totalReceived[rtp.productId]) {
          totalReceived[rtp.productId] = 0;
        }
        totalReceived[rtp.productId] += rtp.quantity;
      }
    }

    return totalReceived;
  }

  recalculerOrderStatus = async (reception: any) => {
    const order = reception.order;
    const otherReceptions = await this.readListRecord({
      where: {
        orderId: order.id,
        status: Not(OrderStatusEnum.canceled),
      },
      relations: { receptionToProducts: true },
    });

    const totalReceived = this.calculateTotalReceived(otherReceptions);

    const isAllReceived = this.orderService.isAllReceivev2(
      order.orderToProducts,
      totalReceived,
    );

    let newStatus: OrderStatusEnum;

    const totalReceivedQuantities = Object.values(totalReceived).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );

    if (totalReceivedQuantities === 0) {
      newStatus = OrderStatusEnum.pending; // ou 'open'
    } else if (isAllReceived) {
      newStatus = OrderStatusEnum.closed;
    } else {
      newStatus = OrderStatusEnum.partialreceived;
    }
    await this.orderService.updateRecord(
      { id: order.id },
      { status: newStatus },
    );
  };

  async validateReception(options: any): Promise<any> {
    const reception = await this.readOneRecord({
      relations: {
        receptionToProducts: { product: true },
        order: { orderToProducts: true },
        receptionToAdditionalCosts: true,
      },
      where: { id: options.id, branchId: options.branchId },
    });

    if (reception.status !== OrderStatusEnum.pending) {
      throw new BadRequestException([
        "Cette réception n'est pas en attente de validation.",
      ]);
    }

    const order = reception.order;

    const otherClosedReceptions = await this.readListRecord({
      where: {
        orderId: order.id,
        status: Equal(OrderStatusEnum.closed),
        id: Not(reception.id),
      },
      relations: {
        receptionToProducts: { product: true },
      },
    });

    const totalReceived = this.calculateTotalReceived(otherClosedReceptions);

    // ⚠️ Ajout des quantités de la réception en cours de validation
    for (const rtp of reception.receptionToProducts) {
      const alreadyReceived = totalReceived[rtp.productId] || 0;
      const ordered =
        order.orderToProducts.find((o) => o.productId === rtp.productId)
          ?.quantity || 0;
      console.log('rttrtrt888888', alreadyReceived, ordered);

      const newTotal = alreadyReceived + rtp.quantity;
      if (newTotal > ordered) {
        console.log('5852222ppopop', newTotal);

        throw new BadRequestException([
          `Tu ne peux pas valider cette réception : le produit ${rtp.product?.displayName ?? ''}-${rtp.product?.sku ?? ''} dépasserait la quantité commandée (${newTotal}/${ordered}).`,
        ]);
      }
    }

    // Si tout est OK → on valide la réception
    reception.status = OrderStatusEnum.closed;
    await this.repository.save(reception);

    // Puis mettre à jour le statut de la commande
    await this.recalculerOrderStatus(reception);

    for (const receptionToProduct of reception.receptionToProducts) {
      const receptionProductData = {
        ...receptionToProduct,
        destinationBranchId: reception.branchId,
        orderId: reception.orderId,
      };
      await this.updateStocks(receptionProductData);
    }

    const entity = await this.repository.findOneBy({ id: reception.id });
    if (entity.status == OrderStatusEnum.closed) {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      entity.closedById = authUser?.id;
      entity.closedAt = new Date();
      await this.repository.update(options, entity);
    }
  }

  async existClosedRecordByOrderId(orderId: string): Promise<any> {
    return await this.repository.exists({
      where: {
        orderId: orderId,
        status: OrderStatusEnum.closed,
      },
    });
  }
}
