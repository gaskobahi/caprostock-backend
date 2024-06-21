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
}
