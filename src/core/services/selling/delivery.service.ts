import { PaginatedService, isUniqueConstraint } from '@app/typeorm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { AbstractService } from '../abstract.service';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';
import { VariantToProductService } from '../subsidiary/variant-to-product.service';
import { Delivery } from 'src/core/entities/selling/delivery.entity';
import { CreateDeliveryDto } from 'src/core/dto/selling/create-delivery.dto';
import { SellingStatusEnum } from 'src/core/definitions/enums';
import { SellingService } from './selling.service';

@Injectable()
export class DeliveryService extends AbstractService<Delivery> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée`;

  constructor(
    @InjectRepository(Delivery)
    private _repository: Repository<Delivery>,
    protected paginatedService: PaginatedService<Delivery>,
    private sellingService: SellingService,
    private branchToProductService: BranchToProductService,
    private readonly branchVariantToProductService: BranchVariantToProductService,
    private readonly productService: ProductService,
    private readonly variantToProductService: VariantToProductService,

    @Inject(REQUEST) protected request: any,
  ) {
    super();
  }

  get repository(): Repository<Delivery> {
    return this._repository;
  }

  async getFilterByAuthUserBranch(): Promise<FindOptionsWhere<Delivery>> {
    const authUser = await super.checkSessionBranch();
    if (!(await authUser.can('manage', 'all'))) {
      return {
        branchId: authUser.targetBranchId,
      };
    }

    return {};
  }

  async createRecord(dto: DeepPartial<CreateDeliveryDto>): Promise<Delivery> {
    try {
      const authUser = await super.checkSessionBranch();
      if (dto.reference) {
        await isUniqueConstraint(
          'reference',
          Delivery,
          { reference: dto.reference },
          {
            message: `La référence "${dto.reference}" de la delivery est déjà utilisée`,
          },
        );
      }
      const response = await super.createRecord({
        ...dto,
        branchId: authUser.targetBranchId,
      });

      //update selling status
      const sellingDetails = await this.sellingService.getDetails(
        dto.sellingId,
      );

      if (sellingDetails) {
        const isAllDelivery = this.sellingService.isAllDelivery(
          sellingDetails?.sellingToProducts,
        );
        if (isAllDelivery) {
          //update selling status
          await this.sellingService.updateRecord(
            { id: sellingDetails.id },
            { status: SellingStatusEnum.closed },
          );
        } else {
          await this.sellingService.updateRecord(
            { id: sellingDetails.id },
            { status: SellingStatusEnum.partialdelivered },
          );
        }

        for (const deliveryToProduct of dto.deliveryToProducts) {
          const deliveryProductData = {
            ...deliveryToProduct,
            destinationBranchId: sellingDetails.destinationBranchId,
            sellingId: dto.sellingId,
          };
          await this.updateStocks(deliveryProductData);
        }
      }
      return response;
    } catch (error) {
      console.error(
        '❌ Erreur lors de la mise à jour du stock, annulation...',
        error,
      );

      // 5️⃣ Suppression manuelle de la livraison si une erreur survient
      if (dto.reference) {
        console.log('erreur update', dto.reference);
        await this.deleteRecord({ reference: dto.reference });
      }
      throw new Error(
        'La livraison a été annulée car une mise à jour du stock a échoué.',
      );
    }
  }

  getDetailBySellingId = async (sellingId: string) => {
    return await this.sellingService.readOneRecord({
      where: { id: sellingId },
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
  };

  async updateStocks(deliveryProductData: any): Promise<void> {
    const prd = await this.productService.getDetails(
      deliveryProductData.productId,
    );

    if (!prd) {
      throw new BadRequestException(
        `Produit ${deliveryProductData.productId} introuvable`,
      );
    }
    // 🔹 Vérification du stock pour la branche actuelle
    const currentBranchStock = this.productService.getBranchStock(
      prd,
      deliveryProductData,
    );
    if (currentBranchStock < deliveryProductData.quantity) {
      throw new BadRequestException(
        `Stock insuffisant pour le produit ${prd.displayName} (ID: ${prd.id}) 
              dans la branche ${deliveryProductData.destinationBranchId}. 
              Stock actuel: ${currentBranchStock}, Quantité demandée: ${deliveryProductData.quantity}`,
      );
    }

    const sellingData = await this.getDetailBySellingId(
      deliveryProductData.sellingId,
    );
    //update item product cost

    if (sellingData && sellingData.sellingToProducts) {
      await this.updateProductCost(
        sellingData.sellingToProducts,
        deliveryProductData,
      );
    }
    //update product stock
    if (prd.hasVariant) {
      await this.updateVariantStock(prd.variantToProducts, deliveryProductData);
    } else {
      if (!prd.isBundle) {
        await this.updateProductStock(
          prd.branchToProducts,
          deliveryProductData,
        );
      } else {
        // Mise à jour du stock pour les bundles
        await this.updateProductStock(
          prd.branchToProducts,
          deliveryProductData,
        );

        for (const nestedBundleItem of prd.bundleToProducts ?? []) {
          const updatedStock =
            nestedBundleItem.quantity * deliveryProductData.quantity;
          await this.updateChildStock(nestedBundleItem, {
            ...deliveryProductData,
            quantity: updatedStock,
          });
        }
      }
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
        { inStock: srcProductBranch.inStock - dto.quantity },
      );
    }
  }

  /**
   * Recursively update the stock for child products in a bundle.
   */
  private async updateChildStock(
    bundleItem: any,
    deliveryProductData: any,
  ): Promise<void> {
    const childProduct = await this.productService.getDetails(
      bundleItem.bundleId,
    );

    // Si l'enfant est aussi un bundle, on le traite récursivement
    await this.updateProductStock(childProduct.branchToProducts, {
      ...deliveryProductData,
      productId: bundleItem.bundleId,
    });
    // Calculate the stock update based on bundle quantity
    const updatedStock = bundleItem.quantity * deliveryProductData.quantity;

    // If the child product is itself a bundle, recursively update its children
    if (childProduct.isBundle) {
      for (const nestedBundleItem of childProduct.bundleToProducts ?? []) {
        await this.updateChildStock(nestedBundleItem, {
          ...deliveryProductData,
          quantity: updatedStock,
        });
      }
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
      { inStock: currentBranchStock.inStock - dto.quantity },
    );
  }

  private async updateProductCost(
    arrayToProducts: any,
    deliveryProductData: any,
  ): Promise<void> {
    for (const oproduct of arrayToProducts ?? []) {
      //consider deliveryd quantity more that 0
      if (
        oproduct.sku == deliveryProductData.sku &&
        deliveryProductData.quantity > 0
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
