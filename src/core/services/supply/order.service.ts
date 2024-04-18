import {
  PaginatedService,
  existsConstraint,
  isUniqueConstraint,
} from '@app/typeorm';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../../entities/supply/order.entity';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { CreateOrderDto } from '../../dto/supply/create-order.dto';
import { OrderSourceEnum, OrderStatusEnum } from '../../definitions/enums';
import { ValidateOrderDto } from '../../dto/supply/validate-order.dto';
import { LockedException } from '@app/nestjs';
import { BranchToProduct } from '../../entities/subsidiary/branch-to-product.entity';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { AbstractService } from '../abstract.service';
import { Supplier } from '../../entities/supply/supplier.entity';
import { Branch } from '../../entities/subsidiary/branch.entity';

@Injectable()
export class OrderService extends AbstractService<Order> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée`;

  constructor(
    @InjectRepository(Order)
    private _repository: Repository<Order>,
    protected paginatedService: PaginatedService<Order>,
    private branchToProductService: BranchToProductService,
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

  async createRecord(dto: DeepPartial<CreateOrderDto>): Promise<Order> {
    const authUser = await super.checkSessionBranch();

    if (dto.source === OrderSourceEnum.branch) {
      delete dto.sourceSupplierId;
    } else if (dto.source === OrderSourceEnum.supplier) {
      delete dto.sourceBranchId;
    }

    // Check exists sourceSupplierId
    if (dto.sourceSupplierId) {
      await existsConstraint(
        'sourceSupplierId',
        Supplier,
        { id: dto.sourceSupplierId },
        { message: `Le fournisseur sélectionné n'existe pas` },
      );
    }

    // Check exists sourceBranchId
    if (dto.sourceBranchId) {
      await existsConstraint(
        'sourceBranchId',
        Branch,
        { id: dto.sourceBranchId },
        { message: `La branche fournisseur sélectionnée n'existe pas` },
      );
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
      status: OrderStatusEnum.init,
    });
  }

  async validateRecord(
    optionsWhere: FindOptionsWhere<Order>,
    status: OrderStatusEnum,
    dto: ValidateOrderDto,
  ) {
    const order = await this._repository.findOne({
      where: optionsWhere,
      relations: {
        //branch: true,
        sale: true,
        orderToProducts: {
          product: true,
        },
      },
    });
    if (!order) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }

    const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;

    // Vérifier que la commande est disponible pour validation
    if (order.isClosed) {
      throw new LockedException(
        `Cette opération n'est plus possible, la commande est déjà clôturée`,
      );
    }
    switch (status) {
      case OrderStatusEnum.validated:
        order.status = OrderStatusEnum.validated;
        let branchToProduct: BranchToProduct;
        // Pour chaque ligne de la commande
        // Approvisionner le stock du produit
        for (const orderToProduct of order.orderToProducts ?? []) {
          branchToProduct =
            await this.branchToProductService.repository.findOne({
              where: {
                branchId: order.branchId,
                productId: orderToProduct.productId,
              },
              relations: {
                product: true,
              },
            });

          // Si le produit n'existe pas dans la succursale, le créer
          if (!branchToProduct) {
            branchToProduct = this.branchToProductService.repository.create({
              branchId: order.branchId,
              productId: orderToProduct.productId,
              availableStock: 0,
              createdById: authUser?.id,
            });
          }

          // Mettre le  stock à jour
          if (branchToProduct.product.isBundle !== true) {
            branchToProduct.availableStock += orderToProduct.quantity;
            branchToProduct.updatedById = authUser?.id;
          }

          await this.branchToProductService.repository.save(branchToProduct);

          branchToProduct = null;
        }
        break;
      case OrderStatusEnum.cancelled:
        order.status = OrderStatusEnum.cancelled;
        break;
      default:
        throw new NotImplementedException(`Opération non autorisée`);
    }

    order.remark = dto.remark;
    order.updatedById = authUser?.id;
    order.validatedById = authUser?.id;
    order.validatedAt = new Date();

    return await this.repository.save(order);
  }
}
