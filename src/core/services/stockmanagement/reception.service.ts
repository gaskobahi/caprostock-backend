import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { CreateReceptionDto } from 'src/core/dto/stockmanagement/create-reception.dto';
import { OrderService } from './order.service';
import { OrderStatusEnum } from 'src/core/definitions/enums';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';

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
      //dto
      //const receptions
      for (const receptionToProduct of dto.receptionToProducts) {
        const receptionProductData = {
          ...receptionToProduct,
          destinationBranchId: orderDetails.destinationBranchId,
        };
        await this.updateStocks(receptionProductData);
        return [] as any;
      }
    }

    return response;
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

  async updateStocks(dto: any): Promise<void> {
    const prd = await this.productService.getDetails(dto.productId);

    if (prd.hasVariant) {
      await this.updateVariantStock(prd.variantToProducts, dto);
    } else {
      await this.updateProductStock(prd.branchToProducts, dto);
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
        { sku: vp.sku, branchId: dto.destinationBranchId },
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
}
