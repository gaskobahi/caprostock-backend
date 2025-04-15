import { isUniqueConstraint, PaginatedService } from '@app/typeorm';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  Equal,
  FindOneOptions,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';
import { AbstractService } from '../abstract.service';
import { BranchVariantToProductService } from '../subsidiary/branch-variant-to-product.service';
import { BranchToProductService } from '../subsidiary/branch-to-product.service';
import { ProductService } from '../product/product.service';
import { VariantToProductService } from '../subsidiary/variant-to-product.service';
import { Delivery } from 'src/core/entities/selling/delivery.entity';
import { CreateDeliveryDto } from 'src/core/dto/selling/create-delivery.dto';
import { SellingStatusEnum } from 'src/core/definitions/enums';
import { SellingService } from './selling.service';
import { Product } from 'src/core/entities/product/product.entity';
import { REQUEST_AUTH_USER_KEY } from 'src/modules/auth/definitions/constants';
import { AuthUser } from 'src/core/entities/session/auth-user.entity';

@Injectable()
export class DeliveryService extends AbstractService<Delivery> {
  public NOT_FOUND_MESSAGE = `Commande non trouvée `;

  constructor(
    @InjectRepository(Delivery)
    private _repository: Repository<Delivery>,
    protected paginatedService: PaginatedService<Delivery>,
    @Inject(forwardRef(() => SellingService))
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

  /*async createRecord(dto: DeepPartial<CreateDeliveryDto>): Promise<Delivery> {
    //try {
    const authUser = await super.checkSessionBranch();
    let response: Delivery;
    try {
      // 🔹 Tentative de création de l'enregistrement
      response = await super.createRecord({
        ...dto,
        branchId: authUser.targetBranchId,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la livraison:', error);
      // 🔴 Retourne une exception claire en cas d'échec
      throw new BadRequestException(
        `Échec de la création de la livraison ${error.message}`,
      );
    }

    const sellingDetails = await this.sellingService.getDetails(dto.sellingId);
    try {
      for (const deliveryToProduct of dto.deliveryToProducts) {
        const deliveryProductData = {
          ...deliveryToProduct,
          destinationBranchId: sellingDetails.destinationBranchId,
          sellingId: dto.sellingId,
        };
        await this.checkStocks(deliveryProductData);
      }

      for (const deliveryToProduct of dto.deliveryToProducts) {
        const deliveryProductData = {
          ...deliveryToProduct,
          destinationBranchId: sellingDetails.destinationBranchId,
          sellingId: dto.sellingId,
        };
        await this.updateStocks(deliveryProductData);
      }
    } catch (error) {
      if (response.reference) {
        await this.deleteRecord({ reference: response.reference });
        throw new BadRequestException(error);
      }
    }
    //update selling status

    if (sellingDetails) {
      const isAllDelivery = this.sellingService.isAllDelivery(
        sellingDetails?.sellingToProducts,
      );
      if (isAllDelivery) {
        //update selling status
        await this.sellingService.updateRecord(
          { id: sellingDetails.id },
          {
            status: SellingStatusEnum.closed,
          },
        );
      } else {
        await this.sellingService.updateRecord(
          { id: sellingDetails.id },
          { status: SellingStatusEnum.partialdelivered },
        );
      }
    }

    return response;
    /*} catch (error) {
      console.error(
        '❌ Erreur lors de la mise à jour du stock, annulation...',
        error,
      );

      // 5️⃣ Suppression manuelle de la livraison si une erreur survient
      if (createResponse.reference) {
        await this.deleteRecord({ reference: createResponse.reference });
      }
      throw new BadRequestException(
        'La livraison a été annulée car une mise à jour du stock a échoué.',
      );
    }
  }*/

  async createRecord(dto: DeepPartial<CreateDeliveryDto>): Promise<Delivery> {
    const authUser = await super.checkSessionBranch();
    if (dto.reference) {
      await isUniqueConstraint(
        'reference',
        Delivery,
        { reference: dto.reference },
        {
          message: `La référence "${dto.reference}" de la réception est déjà utilisée`,
        },
      );
    }
    let createdDelivery: Delivery;

    try {
      // 🔹 Création de la livraison
      createdDelivery = await super.createRecord({
        ...dto,
        branchId: authUser.targetBranchId,
      });

      // Récupération des détails de la commande
      const sellingDetails = await this.sellingService.getDetails(
        dto.sellingId,
      );
      if (!sellingDetails)
        throw new BadRequestException(['Commande introuvable']);
      return createdDelivery;
    } catch (error) {
      // En cas d'erreur, suppression de la réception créée
      if (createdDelivery?.id) {
        await this.deleteRecord({ id: createdDelivery.id });
      }
      throw new BadRequestException(
        `Impossible de créer la livraison : ${error.message}`,
      );
    }

    // 🔹 Récupération des détails de la vente associée
    /*const sellingDetails = await this.sellingService.getDetails(dto.sellingId);
    if (!sellingDetails) {
      throw new BadRequestException(
        `Détails de vente introuvables pour l'ID: ${dto.sellingId}`,
      );
    }*/

    /*try {
      // 🔹 Vérification et mise à jour du stock en une seule boucle
      for (const deliveryToProduct of dto.deliveryToProducts) {
        const deliveryProductData = {
          ...deliveryToProduct,
          destinationBranchId: sellingDetails.destinationBranchId,
          sellingId: dto.sellingId,
        };

        await this.checkStocks(deliveryProductData); // Vérification du stock
        await this.updateStocks(deliveryProductData); // Mise à jour du stock
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du stock:', error);

      // 🛑 Suppression de la livraison en cas d'échec
      if (createdDelivery.reference) {
        await this.deleteRecord({ reference: createdDelivery.reference });
      }
      throw new BadRequestException(
        `Livraison annulée en raison d'une erreur de stock : ${error.message}`,
      );
    }*/

    // 🔹 Mise à jour du statut de la vente après la livraison
    /*const isFullyDelivered = this.sellingService.isAllDelivery(
      sellingDetails.sellingToProducts,
    );

    await this.sellingService.updateRecord(
      { id: sellingDetails.id },
      {
        status: isFullyDelivered
          ? SellingStatusEnum.closed
          : SellingStatusEnum.partialdelivered,
      },
    );*/

    //aaé Qaareturn createdDelivery;
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
    //try {
    const prd = await this.productService.getDetails(
      deliveryProductData.productId,
    );
    if (!prd) {
      throw new BadRequestException(
        `Produit ${deliveryProductData.productId} introuvable`,
      );
    }

    //→ Vérifie le stock avant d'autoriser une livraison.
    //await this.checkStockBeforeDelivery(prd, deliveryProductData);

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

  async checkStocks(deliveryProductData: any): Promise<void> {
    try {
      const productDetails = await this.productService.getDetails(
        deliveryProductData.productId,
      );

      if (!productDetails) {
        throw new BadRequestException([
          `Produit ${deliveryProductData.productId} introuvable.`,
        ]);
      }

      // 🔹 Vérifier le stock du produit principal
      await this.checkStockBeforeDelivery(productDetails, deliveryProductData);
      // Calculate the stock update based on bundle quantity

      // 🔹 Vérifier les stocks des produits du bundle s'il s'agit d'un bundle
      if (productDetails.isBundle) {
        for (const nestedBundleItem of productDetails.bundleToProducts ?? []) {
          const updatedStock =
            nestedBundleItem.quantity * deliveryProductData.quantity;
          try {
            await this.updateChildCheckStock(nestedBundleItem, {
              ...deliveryProductData,
              quantity: updatedStock,
            });
          } catch (error) {
            console.error('❌ Stock insuffisant dans le bundle:', error);
            throw new BadRequestException({ errors: error });
            //stockErrors.push(error.response || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Stock insuffisant:', error);
      throw new BadRequestException(error);
      //stockErrors.push(error.response || error.message);
    }

    // 🔴 Si au moins un produit (ou un élément d’un bundle) a un stock insuffisant, on annule la livraison
    /*if (stockErrors.length > 0) {
      throw new BadRequestException({
        message: `Stock insuffisant pour un ou plusieurs articles (y compris des éléments de bundles).${stockErrors}`,
        details: stockErrors,
      });
    }*/
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

  /*private async updateChildStock(
    bundleItem: any,
    deliveryProductData: any,
  ): Promise<void> {
    const childProduct = await this.productService.getDetails(
      bundleItem.bundleId,
    );

    //→ Vérifie le stock avant d'autoriser une livraison.
    // await this.checkStockBeforeDelivery(childProduct, deliveryProductData);
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
        console.log('122iiiiiii');
        await this.updateChildStock(nestedBundleItem, {
          ...deliveryProductData,
          quantity: updatedStock,
        });
        console.log('222iiiiiii');
      }
    }
  }*/

  private async updateChildStock(
    bundleItem: any,
    deliveryProductData: any,
  ): Promise<void> {
    try {
      if (!bundleItem?.bundleId || !deliveryProductData?.quantity) {
        throw new Error('Données invalides pour la mise à jour du stock.');
      }

      const childProduct = await this.productService.getDetails(
        bundleItem.bundleId,
      );

      // Vérifie que le produit enfant existe
      if (!childProduct) {
        throw new Error(`Produit enfant introuvable: ${bundleItem.bundleId}`);
      }

      // Mise à jour du stock pour les produits associés
      await this.updateProductStock(childProduct.branchToProducts, {
        ...deliveryProductData,
        productId: bundleItem.bundleId,
      });

      // Mise à jour du stock en fonction de la quantité du bundle
      const updatedStock = bundleItem.quantity * deliveryProductData.quantity;

      // Si l'enfant est un bundle, mise à jour récursive
      if (
        childProduct.isBundle &&
        Array.isArray(childProduct.bundleToProducts)
      ) {
        for (const nestedBundleItem of childProduct.bundleToProducts) {
          await this.updateChildStock(nestedBundleItem, {
            ...deliveryProductData,
            quantity: updatedStock,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock enfant:', error);
      throw new BadRequestException({
        message: 'Erreur lors de la mise à jour du stock enfant:',
        details: error.response || error.message,
      });
    }
  }

  /*private async updateChildCheckStock(
    bundleChildItem: any,
    deliveryProductData: any,
  ): Promise<void> {
    try {
      // Récupération des détails du produit enfant (bundle ou produit simple)
      const childProduct = await this.productService.getDetails(
        bundleChildItem.bundleId,
      );

      if (!childProduct) {
        throw new BadRequestException({
          message: `Produit enfant (ID: ${bundleChildItem.id} NAME: ${bundleChildItem.displayName}) introuvable.`,
        });
      }

      // 🔹 Vérification du stock du produit enfant avant mise à jour
      await this.checkStockBeforeDelivery(childProduct, {
        ...deliveryProductData,
        productId: bundleChildItem.id,
      });

      console.log('✅ Stock vérifié pour:', childProduct.displayName);

      // 🔹 Calcul de la quantité totale nécessaire en fonction du bundle
      const updatedStock =
        bundleChildItem.quantity * deliveryProductData.quantity;

      // 🔹 Si le produit enfant est aussi un bundle, traitement récursif de ses sous-produits
      if (childProduct.isBundle) {
        for (const nestedBundleItem of childProduct.bundleToProducts ?? []) {
          await this.updateChildCheckStock(nestedBundleItem, {
            ...deliveryProductData,
            quantity: updatedStock,
          });
        }
      }

      // ✅ Ajout d'un return explicite en cas de succès
      return;
    } catch (error) {
      console.error('❌ Erreur dans updateChildCheckStock:', error.message);
      throw new BadRequestException({
        message: error.message,
        //'Erreur lors de la vérification du stock des produits enfants.',
        details: error.response || error.message,
      });
    }
  }*/

  private async updateChildCheckStock(
    bundleChildItem: any,
    deliveryProductData: any,
  ): Promise<void> {
    try {
      // 🔹 Vérification des entrées
      if (!bundleChildItem?.bundleId || !deliveryProductData?.quantity) {
        throw new BadRequestException({
          message: 'Données invalides pour updateChildCheckStock',
          details: { bundleChildItem, deliveryProductData },
        });
      }

      // 🔹 Récupération des détails du produit enfant
      const childProduct = await this.productService.getDetails(
        bundleChildItem.bundleId,
      );

      if (!childProduct) {
        throw new BadRequestException({
          message: `Produit enfant introuvable (ID: ${bundleChildItem.id}, NAME: ${bundleChildItem.displayName}).`,
        });
      }

      // 🔹 Vérification du stock avant mise à jour
      await this.checkStockBeforeDelivery(childProduct, {
        ...deliveryProductData,
        productId: bundleChildItem.id,
      });

      console.log(
        `✅ Stock vérifié pour: ${childProduct.displayName} (ID: ${childProduct.id})`,
      );

      // 🔹 Calcul de la quantité totale requise
      const updatedStock =
        bundleChildItem.quantity * deliveryProductData.quantity;

      // 🔹 Vérifier si l’enfant est un bundle et a des sous-produits
      if (
        childProduct.isBundle &&
        Array.isArray(childProduct.bundleToProducts) &&
        childProduct.bundleToProducts.length > 0
      ) {
        for (const nestedBundleItem of childProduct.bundleToProducts) {
          await this.updateChildCheckStock(nestedBundleItem, {
            ...deliveryProductData,
            quantity: updatedStock,
          });
        }
      }

      return;
    } catch (error) {
      console.error(
        `❌ Erreur dans updateChildCheckStock (Produit ID: ${bundleChildItem?.id || 'N/A'})`,
        error.message,
      );

      throw new BadRequestException({
        message:
          'Erreur lors de la vérification du stock des produits enfants.',
        details: error.response || error.message,
      });
    }
  }

  /*private async updateProductStock(
    branchToProducts: any, //branchToProducts,
    dto: any,
  ): Promise<void> {
    const currentBranchStock = branchToProducts.find(
      (el: { productId: any; branchId: any }) =>
        el.productId === dto.productId &&
        el.branchId === dto.destinationBranchId,
    );
    console.log('2kkkkkkkkkk');

    await this.branchToProductService.updateRecord(
      {
        productId: dto.productId,
        branchId: dto.destinationBranchId,
      },
      { inStock: currentBranchStock.inStock - dto.quantity },
    );
  }*/

  private async updateProductStock(
    branchToProducts: any[], // Assurez-vous que c'est bien un tableau
    dto: any,
  ): Promise<void> {
    try {
      if (!Array.isArray(branchToProducts) || branchToProducts.length === 0) {
        throw new Error(
          `Données invalides : branchToProducts est vide ou non défini`,
        );
      }

      if (!dto?.productId || !dto?.destinationBranchId || !dto?.quantity) {
        throw new Error(
          `Données invalides : Vérifiez productId, destinationBranchId et quantity`,
        );
      }

      const currentBranchStock = branchToProducts.find(
        (el: { productId: any; branchId: any }) =>
          el.productId === dto.productId &&
          el.branchId === dto.destinationBranchId,
      );

      if (!currentBranchStock) {
        throw new Error(
          `Stock introuvable pour le produit ${dto.productId} à la branche ${dto.destinationBranchId}`,
        );
      }

      console.log(
        `📦 Mise à jour du stock pour produit ${dto.productId} à la branche ${dto.destinationBranchId}`,
      );

      // Mise à jour du stock
      await this.branchToProductService.updateRecord(
        {
          productId: dto.productId,
          branchId: dto.destinationBranchId,
        },
        { inStock: currentBranchStock.inStock - dto.quantity },
      );

      console.log(
        `✅ Stock mis à jour avec succès : Nouveau stock = ${currentBranchStock.inStock - dto.quantity}`,
      );
    } catch (error) {
      console.error(`❌ Erreur dans updateProductStock :`, error.message);
      throw new Error(
        `Erreur lors de la mise à jour du stock : ${error.message}`,
      );
    }
  }

  /* private async updateProductCost(
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
  }*/

  private async updateProductCost(
    arrayToProducts: any[],
    deliveryProductData: any,
  ): Promise<void> {
    try {
      // 🔹 Vérification des entrées
      if (!Array.isArray(arrayToProducts) || arrayToProducts.length === 0) {
        throw new Error(
          'Données invalides : arrayToProducts est vide ou non défini.',
        );
      }

      if (!deliveryProductData?.sku || deliveryProductData?.quantity <= 0) {
        throw new Error('Données invalides : sku ou quantity non défini.');
      }

      for (const oproduct of arrayToProducts) {
        // Vérification du SKU et de la quantité > 0
        if (oproduct?.sku === deliveryProductData.sku) {
          console.log(`🔄 Mise à jour du coût pour SKU: ${oproduct.sku}`);

          try {
            if (oproduct?.variantId) {
              await this.variantToProductService.updateRecord(
                {
                  id: oproduct.variantId,
                  productId: oproduct.productId,
                  sku: oproduct.sku,
                },
                { cost: oproduct.cost },
              );
              console.log(
                `✅ Coût mis à jour pour la variante ID: ${oproduct.variantId}`,
              );
            } else {
              await this.productService.updateRecord(
                { id: oproduct.productId },
                { cost: oproduct.cost },
              );
              console.log(
                `✅ Coût mis à jour pour le produit ID: ${oproduct.productId}`,
              );
            }
          } catch (error) {
            console.error(
              `❌ Erreur lors de la mise à jour du produit SKU: ${oproduct.sku}`,
              error.message,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur dans updateProductCost:', error.message);
      throw new Error(
        `Erreur lors de la mise à jour du coût des produits : ${error.message}`,
      );
    }
  }

  // → Vérifie le stock avant d'autoriser une livraison.
  /* private async checkStockBeforeDelivery(
    product: any,
    deliveryProductData: any,
  ): Promise<void> {
    // 🔹 Vérification du stock pour la branche actuelle
    const currentBranchStock = this.productService.getBranchStock(
      product,
      deliveryProductData,
    );

    console.log('🛑 Vérification du stock pour', product.displayName);
    console.log('📦 Stock actuel:', currentBranchStock);
    console.log('📥 Quantité demandée:', deliveryProductData.quantity);

    if (currentBranchStock < deliveryProductData.quantity) {
      throw new BadRequestException(`Stock insuffisant pour le produit "${product.displayName}" (SKU: ${product.sku}) 
        dans la branche ${deliveryProductData.destinationBranchId}. 
        ➝ Stock actuel: ${currentBranchStock} 
        ➝ Quantité demandée: ${deliveryProductData.quantity} 
        🔹 Problème possible: ${this.analyzeStockIssue(product, currentBranchStock)}`);
    }
  }*/
  private async checkStockBeforeDelivery(
    product: any,
    deliveryProductData: any,
  ): Promise<void> {
    try {
      // 🔹 Vérification des entrées
      if (!product || !product.displayName || !product.sku) {
        throw new BadRequestException(
          'Données du produit invalides ou incomplètes.',
        );
      }

      if (
        !deliveryProductData?.destinationBranchId ||
        deliveryProductData?.quantity == null
      ) {
        throw new BadRequestException(
          'Données de livraison invalides ou incomplètes.',
        );
      }

      // 🔹 Récupération du stock actuel
      const currentBranchStock = this.productService.getBranchStock(
        product,
        deliveryProductData,
      );

      if (currentBranchStock == null) {
        throw new BadRequestException(
          `Impossible de récupérer le stock du produit "${product.displayName}" (SKU: ${product.sku}).`,
        );
      }

      console.log(
        `🛑 Vérification du stock pour ${product.displayName} (SKU: ${product.sku})`,
      );
      console.log(
        `📦 Stock actuel: ${currentBranchStock} | 📥 Quantité demandée: ${deliveryProductData.quantity}`,
      );

      // 🔹 Vérification de la disponibilité du stock
      if (currentBranchStock < deliveryProductData.quantity) {
        throw new BadRequestException({
          message: `📦 Stock insuffisant pour le produit "${product.displayName}" 
          (SKU: ${product.sku}) Stock actuel: ${currentBranchStock} | 
          📥 Quantité demandée: ${deliveryProductData.quantity}.`,
          details: {
            stockActuel: currentBranchStock,
            quantiteDemandee: deliveryProductData.quantity,
            analyse: this.analyzeStockIssue(product, currentBranchStock),
          },
        });
      }

      console.log(
        `✅ Stock suffisant pour ${product.displayName} (SKU: ${product.sku})`,
      );
    } catch (error) {
      console.error('❌ Erreur dans checkStockBeforeDelivery:', error.message);
      throw error;
    }
  }

  private analyzeStockIssue(product: Product, currentStock: number): string {
    if (currentStock === 0) {
      return 'Aucun stock disponible. Vérifiez les réapprovisionnements.';
    } else if (currentStock < 5) {
      return 'Stock critique ! Un réapprovisionnement est recommandé.';
    } else {
      return 'Stock insuffisant pour la demande actuelle. Ajustez les quantités ou vérifiez les autres branches.';
    }
  }

  async readOneRecord(options?: FindOneOptions<Delivery>) {
    const res = await this.repository.findOne(options);
    if (!res) {
      throw new BadRequestException(this.NOT_FOUND_MESSAGE);
    }
    const entity = { ...res, totalAmount: 0, deliveryId: res.id } as any;
    entity.totalAmount = this.totalAmount(entity);
    return entity;
  }

  async cancelRecord(option: any): Promise<any> {
    const delivery = await this.readOneRecord({
      relations: {
        deliveryToProducts: { product: true },
        selling: { sellingToProducts: true },
        deliveryToAdditionalCosts: true,
      },
      where: option,
    });

    if (!delivery) throw new BadRequestException('Réception introuvable');
    // Vérifier si déjà annulée
    if (delivery.status === SellingStatusEnum.canceled) {
      throw new BadRequestException('Réception déjà annulée');
    }

    if (delivery.status == SellingStatusEnum.closed) {
      // Mise à jour des stocks Inverser les effets sur le stock
      for (const deliveryToProduct of delivery.deliveryToProducts) {
        const deliveryProductData = {
          ...deliveryToProduct,
          quantity: -deliveryToProduct.quantity,
          orderId: '',
          destinationBranchId: delivery.branchId,
        };
        await this.updateStocks(deliveryProductData);
      }
    }

    // 2. Marquer la réception comme annulée (ou la supprimer)
    await this.updateRecord(
      { id: delivery.id },
      { status: SellingStatusEnum.canceled },
    );
    // 3. Recalculer le statut de la commande liée
    await this.recalculerSellingStatus(delivery);

    const entity = await this.repository.findOneBy({ id: delivery.id });
    if (entity.status == SellingStatusEnum.canceled) {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      entity.canceledById = authUser?.id;
      entity.canceledAt = new Date();
      await this.repository.update(option, entity);
    }
  }

  totalAmount(entity: any): number {
    if (!entity?.deliveryToProducts) {
      return 0;
    }
    const totalDELAMOUNT = entity.deliveryToProducts.reduce(
      (acc, { quantity = 0, cost = 0 }) => acc + quantity * cost,
      0,
    );
    const totalAddAMOUNT =
      entity.deliveryToProducts?.reduce(
        (acc, { amount = 0 }) => acc + amount,
        0,
      ) || 0;
    return totalDELAMOUNT + totalAddAMOUNT;
  }

  recalculerSellingStatus = async (delivery: any) => {
    const selling = delivery.selling;
    const otherDeliverys = await this.readListRecord({
      where: {
        sellingId: selling.id,
        status: Not(SellingStatusEnum.canceled),
      },
      relations: { deliveryToProducts: true },
    });

    const totalDelivered = this.calculateTotalDelivered(otherDeliverys);

    const isAllReceived = this.sellingService.isAllDeliveryv2(
      selling.sellingToProducts,
      totalDelivered,
    );

    let newStatus: SellingStatusEnum;

    const totalDeliveredQuantities = Object.values(totalDelivered).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );

    if (totalDeliveredQuantities === 0) {
      newStatus = SellingStatusEnum.pending; // ou 'open'
    } else if (isAllReceived) {
      newStatus = SellingStatusEnum.closed;
    } else {
      newStatus = SellingStatusEnum.partialdelivered;
    }
    await this.sellingService.updateRecord(
      { id: selling.id },
      { status: newStatus },
    );
  };

  calculateTotalDelivered(deliverys: Delivery[]): Record<string, number> {
    const totalDelivered: Record<string, number> = {};
    for (const delivery of deliverys) {
      for (const rtp of delivery.deliveryToProducts) {
        if (!totalDelivered[rtp.productId]) {
          totalDelivered[rtp.productId] = 0;
        }
        totalDelivered[rtp.productId] += rtp.quantity;
      }
    }

    return totalDelivered;
  }

  async validateDelivery(options: any): Promise<any> {
    const delivery = await this.readOneRecord({
      relations: {
        deliveryToProducts: { product: true },
        selling: { sellingToProducts: true },
        deliveryToAdditionalCosts: true,
      },
      where: { id: options.id, branchId: options.branchId },
    });

    if (delivery.status !== SellingStatusEnum.pending) {
      throw new BadRequestException([
        "Cette livraison n'est pas en attente de validation.",
      ]);
    }

    const selling = delivery.selling;

    const otherClosedDeliverys = await this.readListRecord({
      where: {
        sellingId: selling.id,
        status: Equal(SellingStatusEnum.closed),
        id: Not(delivery.id),
      },
      relations: {
        deliveryToProducts: { product: true },
      },
    });

    const totalDelivered = this.calculateTotalDelivered(otherClosedDeliverys);

    // ⚠️ Ajout des quantités de la réception en cours de validation
    for (const rtp of delivery.deliveryToProducts) {
      const alreadyDelivered = totalDelivered[rtp.productId] || 0;
      const sellinged =
        selling.sellingToProducts.find((o) => o.productId === rtp.productId)
          ?.quantity || 0;

      const newTotal = alreadyDelivered + rtp.quantity;
      if (newTotal > sellinged) {
        throw new BadRequestException([
          `Tu ne peux pas valider cette livraison : le produit ${rtp.product?.displayName ?? ''}-${rtp.product?.sku ?? ''} dépasserait la quantité commandée (${newTotal}/${sellinged}).`,
        ]);
      }
    }
    // 1. Vérification des stocks et données avant toute modification
    for (const deliveryToProduct of delivery.deliveryToProducts) {
      const deliveryProductData = {
        ...deliveryToProduct,
        destinationBranchId: delivery.branchId,
        sellingId: delivery.sellingId,
      };

      await this.checkStocks(deliveryProductData); // Vérifie que le stock est suffisant
    }
    // Si tout est OK → on valide la réception
    delivery.status = SellingStatusEnum.closed;
    await this.repository.save(delivery);

    // Puis mettre à jour le statut de la commande
    await this.recalculerSellingStatus(delivery);

    for (const deliveryToProduct of delivery.deliveryToProducts) {
      const deliveryProductData = {
        ...deliveryToProduct,
        destinationBranchId: delivery.branchId,
        sellingId: delivery.sellingId,
      };
      await this.updateStocks(deliveryProductData);
    }

    // 4. Mise à jour des stocks uniquement après validation complète
    const entity = await this.repository.findOneBy({ id: delivery.id });
    if (entity.status == SellingStatusEnum.closed) {
      const authUser = this.request[REQUEST_AUTH_USER_KEY] as AuthUser;
      entity.closedById = authUser?.id;
      entity.closedAt = new Date();
      await this.repository.update(options, entity);
    }
  }

  async existClosedRecordBySellingId(sellingId: string): Promise<any> {
    return await this.repository.exists({
      where: {
        sellingId: sellingId,
        status: SellingStatusEnum.closed,
      },
    });
  }
}
