import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import { DeepPartial, FindOptionsWhere, Not, Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { CreateReceptionDto } from 'src/core/dto/stockmanagement/create-reception.dto';
import { OrderService } from './order.service';
import { OrderStatusEnum } from 'src/core/definitions/enums';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';
import { VariantToProductService } from '../subsidiary/variant-to-product.service';

@Injectable()
export class ReceptionService extends AbstractService<Reception> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée`;

  constructor(
    @InjectRepository(Reception)
    private _repository: Repository<Reception>,
    protected paginatedService: PaginatedService<Reception>,
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

  /*async createRecord(dto: DeepPartial<CreateReceptionDto>): Promise<Reception> {
    const authUser = await super.checkSessionBranch();
    // Check unique reference
    if (dto.reference) {
      await isUniqueConstraint(
        'reference',
        Reception,
        { reference: dto.reference },
        {
          message: `La référence "${dto.reference}" de la reception est déjà utilisée`,
        },
      );
    }
    console.log('bori56565s',dto)
    const response = await super.createRecord({
      ...dto,
      branchId: authUser.targetBranchId,
    });

    //update order status
    const orderDetails = await this.orderService.getDetails(dto.orderId);

    if (orderDetails) {
      const isAllReceive = this.orderService.isAllReceive(
        orderDetails?.orderToProducts,
      );
      if (isAllReceive) {
        //update order status
        await this.orderService.updateRecord(
          { id: orderDetails.id },
          { status: OrderStatusEnum.closed },
        );
      } else {
        await this.orderService.updateRecord(
          { id: orderDetails.id },
          { status: OrderStatusEnum.partialreceived },
        );
      }

      for (const receptionToProduct of dto.receptionToProducts) {
        const receptionProductData = {
          ...receptionToProduct,
          destinationBranchId: orderDetails.destinationBranchId,
          orderId: dto.orderId,
        };
        await this.updateStocks(receptionProductData);
      }
    }
    return response;
  }*/
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
      if (!orderDetails) throw new Error('Commande introuvable');

      // Vérification si toute la commande est reçue
      const isAllReceive = this.orderService.isAllReceive(
        orderDetails?.orderToProducts,
      );

      // Mise à jour des stocks
      for (const receptionToProduct of dto.receptionToProducts) {
        const receptionProductData = {
          ...receptionToProduct,
          destinationBranchId: orderDetails.destinationBranchId,
          orderId: dto.orderId,
        };
        await this.updateStocks(receptionProductData);
      }

      // Mise à jour du statut de la commande
      await this.orderService.updateRecord(
        { id: orderDetails.id },
        {
          status: isAllReceive
            ? OrderStatusEnum.closed
            : OrderStatusEnum.partialreceived,
        },
      );

      return response;
    } catch (error) {
      // En cas d'erreur, suppression de la réception créée
      if (response?.id) {
        await this.deleteRecord({ id: response.id });
      }
      // Journaliser l'erreur et la relancer
      console.error('Erreur lors de la création de la réception :', error);
      throw new Error(
        "Une erreur est survenue lors de la création de la réception. L'opération a été annulée.",
      );
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
  }

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
    if (!order) throw new Error('Commande introuvable');

    if (order.status === OrderStatusEnum.closed) {
      throw new Error("Impossible d'annuler une commande déjà clôturée.");
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

  async cancelReception(receptionId: string): Promise<void> {
    const reception = await this.repository.findOne({
      where: { id: receptionId },
      relations: ['receptionToProducts', 'order'],
    });

    if (!reception) throw new Error('Réception introuvable');

    // Vérifier si déjà annulée
    /*if (reception.status === 'canceled') {
      throw new Error('Réception déjà annulée');
    }*/

    // 1. Inverser les effets sur le stock
    /*for (const rtp of reception.receptionToProducts) {
      await this.stockService.updateQuantity(
        rtp.productId,
        reception.branchId,
        -rtp.quantity,
      );

      await this.stockMovementsService.create({
        productId: rtp.productId,
        branchId: reception.branchId,
        quantity: -rtp.quantity,
        type: 'ANNULATION_RECEPTION',
        reference: `Annulation de la réception ${reception.reference}`,
      });
    }

    // 2. Marquer la réception comme annulée (ou la supprimer)
    await this.repository.update(reception.id, {
      status: 'canceled', // ou deletedAt: new Date()
    });*/

    // 3. Recalculer le statut de la commande liée
   /* const order = reception.order;
    const otherReceptions = await this.repository.find({
      where: {
        orderId: order.id,
        status: Not('canceled'),
      },
      relations: ['receptionToProducts'],
    });*/

    //const totalReceived = this.calculateTotalReceived(otherReceptions);

    /*const isAllReceived = this.orderService.isAllReceive(totalReceived);
    await this.orderService.updateRecord(
      { id: order.id },
      {
        status: isAllReceived
          ? OrderStatusEnum.closed
          : OrderStatusEnum.partialreceived,
      },
    );*/
  }
}
