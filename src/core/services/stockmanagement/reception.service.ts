import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import {
  DeepPartial,
  Equal,
  FindOneOptions,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';
import { AbstractService } from '../abstract.service';
import { CreateReceptionDto } from 'src/core/dto/stockmanagement/create-reception.dto';
import { OrderService } from './order.service';
import {
  OrderStatusEnum,
  ReasonTypeEnum,
  StockMovementSourceEnum,
  StockMovementTypeEnum,
} from 'src/core/definitions/enums';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';
import { VariantToProductService } from '../subsidiary/variant-to-product.service';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';
import { RunInTransactionService } from '../transaction/runInTransaction.service';
import { StockMovementService } from '../stockMovement/stockMovement.service';

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
    private readonly runInTransactionService: RunInTransactionService,
    private readonly stockMovementService: StockMovementService,

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

  async updateStocks(receptionProductData: any, manager?: any): Promise<void> {
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
          manager,
        );
      }
    }

    //update product stock
    if (prd.hasVariant) {
      await this.updateVariantStock(
        prd.variantToProducts,
        receptionProductData,
        manager,
      );
    } else {
      await this.updateProductStock(
        prd.branchToProducts,
        receptionProductData,
        manager,
      );
    }
  }

  async updateStockMovements(
    receptionProductData: any,
    manager?: any,
  ): Promise<void> {
    if (manager) {
      await manager.getRepository(this.stockMovementService.entity).save({
        productId: receptionProductData.productId,
        quantity: receptionProductData.quantity,
        type: StockMovementTypeEnum.input,
        source: StockMovementSourceEnum.reception,
        branchId: receptionProductData.destinationBranchId,
        sku: receptionProductData.sku,
        reference: receptionProductData.reference,
        sourceId: receptionProductData.sourceId,
        cost: receptionProductData.cost,
        reason: ReasonTypeEnum.reception,
        totalCost: receptionProductData.quantity * receptionProductData.cost,
        createdById: receptionProductData.createdById,
      });
    } else {
      // Journaliser le mouvement
      await this.stockMovementService.createRecord({
        productId: receptionProductData.productId,
        quantity: receptionProductData.quantity,
        type: StockMovementTypeEnum.input,
        source: StockMovementSourceEnum.reception,
        branchId: receptionProductData.destinationBranchId,
        sku: receptionProductData.sku,
        reference: receptionProductData.reference,
        sourceId: receptionProductData.sourceId,
        cost: receptionProductData.cost,
        reason: ReasonTypeEnum.reception,
        totalCost: receptionProductData.quantity * receptionProductData.cost,
        isManual: false,
      });
    }
  }

  private async updateVariantStock(
    variants: any[],
    dto: any,
    manager?: any,
  ): Promise<void> {
    const vp = variants.find((el: { sku: any }) => el.sku === dto.sku);

    if (!vp) return;

    const srcProductBranch = vp.branchVariantToProducts.find(
      (el: { branchId: any; sku: any }) =>
        el.branchId === dto.destinationBranchId && el.sku === vp.sku,
    );

    if (srcProductBranch) {
      if (manager) {
        await manager
          .getRepository(this.branchVariantToProductService.entity)
          .update(
            { sku: srcProductBranch.sku, branchId: dto.destinationBranchId },
            { inStock: srcProductBranch.inStock + dto.quantity },
          );
      } else {
        await this.branchVariantToProductService.updateRecord(
          { sku: srcProductBranch.sku, branchId: dto.destinationBranchId },
          { inStock: srcProductBranch.inStock + dto.quantity },
        );
      }
    }
  }

  private async updateProductStock(
    branchToProducts: any, //branchToProducts,
    dto: any,
    manager?: any,
  ): Promise<void> {
    const currentBranchStock = branchToProducts.find(
      (el: { productId: any; branchId: any }) =>
        el.productId === dto.productId &&
        el.branchId === dto.destinationBranchId,
    );
    if (manager) {
      await manager.getRepository(this.branchToProductService.entity).update(
        {
          productId: dto.productId,
          branchId: dto.destinationBranchId,
        },
        { inStock: currentBranchStock.inStock + dto.quantity },
      );
    } else {
      await this.branchToProductService.updateRecord(
        {
          productId: dto.productId,
          branchId: dto.destinationBranchId,
        },
        { inStock: currentBranchStock.inStock + dto.quantity },
      );
    }
  }

  private async updateProductCost(
    arrayToProducts: any,
    receptionProductData: any,
    manager?: any,
  ): Promise<void> {
    for (const oproduct of arrayToProducts ?? []) {
      //consider received quantity more that 0
      if (
        oproduct.sku == receptionProductData.sku &&
        receptionProductData.quantity > 0
      ) {
        if (oproduct.variantId) {
          if (manager) {
            await manager
              .getRepository(this.variantToProductService.entity)
              .update(
                {
                  id: oproduct.variantId,
                  productId: oproduct.productId,
                  sku: oproduct.sku,
                },
                { cost: oproduct.cost },
              );
          } else {
            await this.variantToProductService.updateRecord(
              {
                id: oproduct.variantId,
                productId: oproduct.productId,
                sku: oproduct.sku,
              },
              { cost: oproduct.cost },
            );
          }
        } else {
          if (manager) {
            await manager.getRepository(this.productService.entity).update(
              {
                id: oproduct.productId,
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
  }

  async readOneRecord(options?: FindOneOptions<Reception>) {
    const res = await this.repository.findOne(options);
    if (!res) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const entity = { ...res, totalAmount: 0, receptionId: res.id } as any;
    entity.totalAmount = this.totalAmount(entity);
    return entity;
  }

  async cancelRecord(option: any): Promise<any> {
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

    const entity = await this.repository.findOneBy({ id: reception.id });
    if (entity.status == OrderStatusEnum.canceled) {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      entity.canceledById = authUser?.id;
      entity.canceledAt = new Date();
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
    const reception = await this.getReceptionWithRelations(options);
    if (reception.status !== OrderStatusEnum.pending) {
      throw new BadRequestException([
        "Cette réception n'est pas en attente de validation.",
      ]);
    }
    const otherClosedReceptions = await this.otherClosedReceptions(reception);
    this.validateReceptedQuantities(reception, otherClosedReceptions);
    await this.runInTransactionService.runInTransaction(async (manager) => {
      // Si tout est OK → on valide la réception
      reception.status = OrderStatusEnum.closed;
      await manager.save(Reception, reception);

      // Puis mettre à jour le statut de la commande
      await this.recalculerOrderStatus(reception);
      await this.applyStockUpdate(reception, manager);
      await this.applyStockMouvementUpdate(reception, manager);

      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      reception.closedById = authUser?.id;
      reception.closedAt = new Date();
      await manager.save(Reception, reception);
    });
  }

  async existClosedRecordByOrderId(orderId: string): Promise<any> {
    return await this.repository.exists({
      where: {
        orderId: orderId,
        status: OrderStatusEnum.closed,
      },
    });
  }

  totalAmount(entity: any): number {
    if (!entity?.receptionToProducts) {
      return 0;
    }
    const totalRepAMOUNT = entity.receptionToProducts.reduce(
      (acc, { quantity = 0, cost = 0 }) => acc + quantity * cost,
      0,
    );
    const totalAddAMOUNT =
      entity.receptionToAdditionalCosts?.reduce(
        (acc, { amount = 0 }) => acc + amount,
        0,
      ) || 0;
    return totalRepAMOUNT + totalAddAMOUNT;
  }

  async getReceptionWithRelations(options: any) {
    return await this.readOneRecord({
      relations: {
        receptionToProducts: { product: true },
        order: { orderToProducts: true },
        receptionToAdditionalCosts: true,
      },
      where: { id: options.id, branchId: options.branchId },
    });
  }

  async otherClosedReceptions(reception) {
    return await this.readListRecord({
      where: {
        orderId: reception.orderId,
        status: Equal(OrderStatusEnum.closed),
        id: Not(reception.id),
      },
      relations: {
        receptionToProducts: { product: true },
      },
    });
  }

  private validateReceptedQuantities(reception, otherClosedReceptions) {
    const order = reception.order;

    const totalReceived = this.calculateTotalReceived(otherClosedReceptions);

    // ⚠️ Ajout des quantités de la réception en cours de validation
    for (const rtp of reception.receptionToProducts) {
      const alreadyReceived = totalReceived[rtp.productId] || 0;
      const ordered =
        order.orderToProducts.find(
          (o) => o.productId === rtp.productId && o.sku === rtp.sku,
        )?.quantity || 0;

      const newTotal = alreadyReceived + rtp.quantity;
      if (newTotal > ordered) {
        throw new BadRequestException([
          `Tu ne peux pas valider cette réception : le produit ${rtp.product?.displayName ?? ''}-${rtp.product?.sku ?? ''} dépasserait la quantité commandée (${newTotal}/${ordered}).`,
        ]);
      }
    }
  }

  private async applyStockUpdate(reception: any, manager?: any) {
    for (const receptionToProduct of reception.receptionToProducts) {
      const receptionProductData = {
        ...receptionToProduct,
        destinationBranchId: reception.branchId,
        sellingId: reception.sellingId,
      };
      await this.updateStocks(receptionProductData, manager);
    }
  }

  private async applyStockMouvementUpdate(reception: any, manager?: any) {
    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
    reception.closedById = authUser?.id;
    for (const receptionToProduct of reception.receptionToProducts) {
      const receptionProductData = {
        ...receptionToProduct,
        destinationBranchId: reception.branchId,
        reference: reception.reference,
        sourceId: reception.id,
        createdById: authUser?.id,
      };
      await this.updateStockMovements(receptionProductData, manager);
    }
  }
}
