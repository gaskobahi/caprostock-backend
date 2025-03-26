import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Do this for dependencies import caution.
import { AuthUser } from './entities/session/auth-user.entity';
// find file relave path for dependencies import caution
import { AccessRequestHistory } from './entities/session/access-request-history.entity';
import { AuthLog } from './entities/session/auth-log.entity';
import { Role } from './entities/user/role.entity';
import { UserController } from './controllers/user/user.controller';
import { RoleController } from './controllers/user/role.controller';
import { BranchController } from './controllers/subsidiary/branch.controller';
import { ProductController } from './controllers/product/product.controller';
import { ActionHistoryController } from './controllers/session/action-history.controller';
import { UserService } from './services/user/user.service';
import { AuthLogService } from './services/session/auth-log.service';
import { RoleService } from './services/user/role.service';
import { AuthUserService } from './services/session/auth-user.service';
import { AttributeController } from './controllers/product/attribute.controller';
//import { Consult } from './entities/consultation/consult.entity';
import { Product } from './entities/product/product.entity';
import { Attribute } from './entities/product/attribute.entity';
import { AttributeValue } from './entities/product/attribute-value.entity';
import { Branch } from './entities/subsidiary/branch.entity';
import { BranchToProduct } from './entities/subsidiary/branch-to-product.entity';
import { BranchService } from './services/subsidiary/branch.service';
import { ProductService } from './services/product/product.service';
import { AttributeService } from './services/product/attribute.service';
import { BranchToProductService } from './services/subsidiary/branch-to-product.service';
import { User } from './entities/user/user.entity';
import { SystemController } from './controllers/system.controller';
import { DefaultDataService } from './services/system/default-data.service';
import { ModuleRef } from '@nestjs/core';
import { Brand } from './entities/product/brand.entity';
import { BrandService } from './services/product/brand.service';
import { BrandController } from './controllers/product/brand.controller';
import { Supplier } from './entities/stockmanagement/supplier.entity';
import { SupplierController } from './controllers/stockmanagement/supplier.controller';
import { SupplierService } from './services/stockmanagement/supplier.service';
import { BundleToProduct } from './entities/product/bundle-to-product.entity';
import { Category } from './entities/product/category.entity';
import { CategoryService } from './services/product/category.service';
import { CategoryController } from './controllers/product/category.controller';
import { Table } from './entities/selling2/table.entity';
import { Pin } from './entities/user/pin.entity';
import { PinController } from './controllers/user/pin.controller';
import { PinService } from './services/user/pin.service';
import { BranchToUser } from './entities/subsidiary/branch-to-user.entity';
import { AccessService } from './services/user/access.service';
import { AccessController } from './controllers/user/access.controller';
import { Access } from './entities/user/access.entity';
import { AccessToRole } from './entities/user/access-to-role.entity';
import { ProductOption } from './entities/product/product-option.entity';
import { VariantToProduct } from './entities/product/variant-to-product.entity';
import { BranchVariantToProduct } from './entities/subsidiary/branch-variant-to-product.entity';
import { ProductSubscriber } from './entities/product/product.subscriber';
import { FileController } from './controllers/file.controller';
import { ConfigService } from './services/system/config.service';
import { Modifier } from './entities/product/modifier.entity';
import { OptionToModifier } from './entities/product/option-to-modifier.entity';
import { BranchToModifier } from './entities/subsidiary/branch-to-modifier.entity';
import { ModifierService } from './services/product/modifier.service';
import { ModifierController } from './controllers/product/modifier.controller';
import { Discount } from './entities/product/discount.entity';
import { DiscountController } from './controllers/product/discount.controller';
import { DiscountService } from './services/product/discount.service';
import { ModifierToProduct } from './entities/product/modifier-to-product.entity';
import { Tax } from './entities/setting/tax.entity';
import { TaxController } from './controllers/setting/tax.controller';
import { TaxService } from './services/setting/tax.service';
import { BranchToTax } from './entities/subsidiary/branch-to-tax.entity';
import { TaxToProduct } from './entities/product/tax-to-product.entity';
import { TaxToProductService } from './services/product/tax-to-product.service';
import { DiscountToProduct } from './entities/product/discount-to-product.entity';
import { Feature } from './entities/setting/feature.entity';
import { FeatureService } from './services/setting/feature.service';
import { FeatureController } from './controllers/setting/feature.controller';
import { BranchToDining } from './entities/subsidiary/branch-to-dining.entity';
import { Dining } from './entities/setting/dining.entity';
import { DiningController } from './controllers/setting/dining.controller';
import { DiningService } from './services/setting/dining.service';
import { DiningToTax } from './entities/setting/dining-to-tax.entity';
import { ProductToTax } from './entities/setting/product-to-tax.entity';
import { Customer } from './entities/selling/customer.entity';
import { CustomerController } from './controllers/selling/customer.controller';
import { CustomerService } from './services/selling/customer.service';
import { Loyalty } from './entities/setting/loyalty.entity';
import { LoyaltyController } from './controllers/setting/loyalty.controller';
import { LoyaltyService } from './services/setting/loyalty.service';
import { Setting } from './entities/setting/setting.entity';
import { SettingController } from './controllers/setting/setting.controller';
import { SettingService } from './services/setting/setting.service';
import { Box } from './entities/setting/box.entity';
import { BoxService } from './services/setting/box.service';
import { BoxController } from './controllers/setting/box.controller';
import { Reason } from './entities/stockmanagement/reason.entity';
import { ReasonController } from './controllers/stockmanagement/reason.controller';
import { ReasonService } from './services/stockmanagement/reason.service';
import { StockAdjustment } from './entities/stockmanagement/stockadjustment.entity';
import { ProductToStockAdjustment } from './entities/stockmanagement/product-to-stockadjustment.entity';
import { StockAdjustmentController } from './controllers/stockmanagement/stock-adjustment.controller';
import { StockAdjustmentService } from './services/stockmanagement/stock-adjustment.service';
import { StockAdjustmentSubscriber } from './entities/stockmanagement/stockadjustment.subscriber';
import { BranchVariantToProductService } from './services/subsidiary/branch-variant-to-product.service';
import { InventoryCount } from './entities/stockmanagement/inventorycount.entity';
import { ProductToInventoryCount } from './entities/stockmanagement/product-to-inventoryCount.entity';
import { InventoryCountSubscriber } from './entities/stockmanagement/Inventorycount.subscriber';
import { InventoryCountService } from './services/stockmanagement/inventory-count.service';
import { InventoryCountController } from './controllers/stockmanagement/inventory-count.controller';
import { HistoryToInventoryCount } from './entities/stockmanagement/history-to-inventorycount.entity';
import { TransfertOrder } from './entities/stockmanagement/transfertorder.entity';
import { ProductToTransfertOrder } from './entities/stockmanagement/product-to-transfertorder.entity';
import { TransfertOrderSubscriber } from './entities/stockmanagement/transfertorder.subscriber';
import { TransfertOrderService } from './services/stockmanagement/transfert-order.service';
import { TransfertOrderController } from './controllers/stockmanagement/transfert-order.controller';
import { OrderToProduct } from './entities/stockmanagement/order-to-product.entity';
import { Order } from './entities/stockmanagement/order.entity';
import { OrderController } from './controllers/stockmanagement/order.controller';
import { OrderService } from './services/stockmanagement/order.service';
import { OrderSubscriber } from './entities/stockmanagement/order.subscriber';
import { ReceptionToProduct } from './entities/stockmanagement/reception-to-product.entity';
import { Reception } from './entities/stockmanagement/reception.entity';
import { ReceptionSubscriber } from './entities/stockmanagement/reception.subscriber';
import { ReceptionController } from './controllers/stockmanagement/reception.controller';
import { OrderToAdditionalCost } from './entities/stockmanagement/order-to-addtionnal-cost.entity';
import { ReceptionToAdditionalCost } from './entities/stockmanagement/reception-to-addtionnal-cost.entity';
import { VariantToProductService } from './services/subsidiary/variant-to-product.service';
import { ProductionSubscriber } from './entities/stockmanagement/production.subscriber';
import { ProductionToProduct } from './entities/stockmanagement/production-to-product.entity';
import { Production } from './entities/stockmanagement/production.entity';
import { ProductionController } from './controllers/stockmanagement/production.controller';
import { ProductionService } from './services/stockmanagement/production.service';
import { Corder } from './entities/selling/Corder.entity';
import { CorderToProduct } from './entities/selling/corder-to-product.entity';
import { CorderSubscriber } from './entities/selling/corder.subscriber';
import { Ticket } from './entities/selling/ticket.entity';
import { OpenticketToPredefined } from './entities/selling/openticket-to-predefined.entity';
import { OpenTicket } from './entities/selling/open-ticket.entity';
import { OpenTicketService } from './services/selling/open-ticket.service';
import { OpenTicketController } from './controllers/selling/open-ticket.controller';
import { SellingToProduct } from './entities/selling/selling-to-product.entity';
import { SellingToAdditionalCost } from './entities/selling/selling-to-addtionnal-cost.entity';
import { Selling } from './entities/selling/selling.entity';
import { SellingController } from './controllers/selling/selling.controller';
import { SellingService } from './services/selling/selling.service';
import { SellingSubscriber } from './entities/selling/selling.subscriber';
import { Delivery } from './entities/selling/delivery.entity';
import { DeliveryToProduct } from './entities/selling/delivery-to-product.entity';
import { DeliveryToAdditionalCost } from './entities/selling/delivery-to-addtionnal-cost.entity';
import { ReceptionService } from './services/stockmanagement/reception.service';
import { DeliveryService } from './services/selling/delivery.service';
import { DeliverySubscriber } from './entities/selling/delivery.subscriber';
import { DeliveryController } from './controllers/stockmanagement/deliverycontroller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccessRequestHistory,
      AuthLog,
      AuthUser,
      User,
      Pin,
      Role,
      AccessToRole,
      Access,
      Product,
      Category,
      Table,
      Modifier,
      OptionToModifier,
      BranchToModifier,
      ModifierToProduct,
      Discount,
      DiscountToProduct,

      Tax,
      BranchToTax,
      TaxToProduct,
      ProductToTax,

      Feature,
      //FeatureToTax,

      Attribute,
      AttributeValue,

      Dining,
      BranchToDining,
      DiningToTax,

      Branch,
      BranchVariantToProduct,
      BranchToProduct,
      BundleToProduct,

      ProductOption,
      VariantToProduct,
      BranchToUser,
      Brand,
      Supplier,

      Customer,

      Loyalty,

      Setting,

      Box,

      Reason,
      StockAdjustment,
      ProductToStockAdjustment,
      InventoryCount,
      ProductToInventoryCount,
      HistoryToInventoryCount,
      TransfertOrder,
      ProductToTransfertOrder,

      Order,
      OrderToProduct,
      OrderToAdditionalCost,

      Selling,
      SellingToProduct,
      SellingToAdditionalCost,

      Reception,
      ReceptionToProduct,
      ReceptionToAdditionalCost,

      Delivery,
      DeliveryToProduct,
      DeliveryToAdditionalCost,

      ProductionToProduct,
      Production,

      Ticket,
      CorderToProduct,
      Corder,

      OpenticketToPredefined,
      OpenTicket,
    ]),
  ],
  controllers: [
    UserController,
    RoleController,
    AccessController,
    PinController,
    BranchController,
    ProductController,
    CategoryController,
    ModifierController,
    DiscountController,
    TaxController,
    FeatureController,
    DiningController,

    ActionHistoryController,
    AttributeController,
    SystemController,
    BrandController,
    SupplierController,
    CustomerController,

    LoyaltyController,
    SettingController,
    BoxController,

    ReasonController,
    StockAdjustmentController,
    InventoryCountController,
    TransfertOrderController,
    OrderController,
    SellingController,
    ReceptionController,
    DeliveryController,
    ProductionController,

    OpenTicketController,

    FileController,
  ],
  providers: [
    UserService,
    AuthUserService,
    AuthLogService,
    RoleService,
    AccessService,
    PinService,
    BranchService,
    ProductService,
    ProductSubscriber,
    CategoryService,
    ModifierService,
    DiscountService,
    TaxService,
    TaxToProductService,

    FeatureService,
    DiningService,
    AttributeService,
    BranchToProductService,
    BranchVariantToProductService,
    VariantToProductService,

    DefaultDataService,
    BrandService,
    SupplierService,
    CustomerService,

    LoyaltyService,
    SettingService,
    BoxService,

    ReasonService,
    StockAdjustmentService,
    StockAdjustmentSubscriber,

    InventoryCountService,
    InventoryCountSubscriber,

    TransfertOrderService,
    TransfertOrderSubscriber,

    OrderService,
    OrderSubscriber,

    SellingService,
    SellingSubscriber,

    ReceptionService,
    ReceptionSubscriber,

    DeliveryService,
    DeliverySubscriber,

    ProductionService,
    ProductionSubscriber,

    CorderSubscriber,

    OpenTicketService,

    ConfigService,
  ],
  exports: [TypeOrmModule, UserService, AuthUserService, AuthLogService],
})
export class CoreModule implements OnApplicationBootstrap {
  constructor(private moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    console.log(`*** [${CoreModule.name}][onApplicationBootstrap] start`);
    const defaultDataService = this.moduleRef.get(DefaultDataService);
    defaultDataService
      .createDefaultData()
      .then((result) => {
        console.log(
          `*** [${CoreModule.name}][onApplicationBootstrap] default data created =>`,
          result,
        );
      })
      .catch((error) => {
        console.error(
          `*** [${CoreModule.name}][onApplicationBootstrap] default data creating failed`,
          error,
        );
      });
  }
}
