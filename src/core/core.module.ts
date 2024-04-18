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
import { Supplier } from './entities/supply/supplier.entity';
import { SupplierController } from './controllers/supply/supplier.controller';
import { SupplierService } from './services/supply/supplier.service';
/*import { Order } from './entities/supply/order.entity';
import { OrderToProduct } from './entities/supply/order-to-product.entity';
import { OrderService } from './services/supply/order.service';
import { OrderSubscriber } from './entities/supply/order.subscriber';
import { OrderController } from './controllers/supply/order.controller';
import { ConsultType } from './entities/consultation/consult-type.entity';*/
//import { Doctor } from './entities/consultation/doctor.entity';
//import { Patient } from './entities/consultation/patient.entity';
//import { ConsultService } from './services/consultation/consult.service';
//import { ConsultTypeService } from './services/consultation/consult-type.service';
//import { DoctorService } from './services/consultation/doctor.service';
//import { PatientService } from './services/consultation/patient.service';
//import { ConsultSubscriber } from './entities/consultation/consult.subscriber';
//import { ConsultController } from './controllers/consultation/consult.controller';
//import { ConsultTypeController } from './controllers/consultation/consult-type.controller';
//import { DoctorController } from './controllers/consultation/doctor.controller';
//import { PatientController } from './controllers/consultation/patient.controller';
import { BundleToProduct } from './entities/product/bundle-to-product.entity';
//import { Customer } from './entities/selling/customer.entity';
//import { InsuranceCompany } from './entities/selling/insurance-company.entity';
//import { SaleToProduct } from './entities/selling/sale-to-product.entity';
//import { Sale } from './entities/selling/sale.entity';
//import { CustomerService } from './services/selling/customer.service';
//import { CustomerController } from './controllers/selling/customer.controller';
//import { InsuranceCompanyService } from './services/selling/insurance-company.service';
//import { SaleService } from './services/selling/sale.service';
//import { InsuranceCompanyController } from './controllers/selling/insurance-company.controller';
//import { SaleController } from './controllers/selling/sale.controller';
//import { SaleSubscriber } from './entities/selling/sale.subscriber';
//import { DoctorSubscriber } from './entities/consultation/doctor.subscriber';
/*import { ProductPrescription } from './entities/selling/product-prescription.entity';
import { PrescriptionGlassCharacteristic } from './entities/selling/prescription-glass-characteristic.entity';
import { SaleProductToAttribute } from './entities/selling/sale-product-to-attribute.entity';
import { SalePayment } from './entities/selling/sale-payment.entity';
import { SalePaymentService } from './services/selling/sale-payment.service';
import { ConsultPrintingHistory } from './entities/consultation/consult-printing-history.entity';
import { SalePrintingHistory } from './entities/selling/sale-printing-history.entity';
import { Treatment } from './entities/selling/treatment.entity';
import { TreatmentService } from './services/selling/treatment.service';
import { TreatmentController } from './controllers/selling/treatment.controller';
import { SalePaymentSubscriber } from './entities/selling/sale-payment.subscriber';
import { SalePaymentPrintingHistory } from './entities/selling/sale-payment-printing-history.entity';*/
import { Category } from './entities/product/category.entity';
import { CategoryService } from './services/product/category.service';
import { CategoryController } from './controllers/product/category.controller';
//import { AttributeToProduct } from './entities/product/attribute-to-product.entity';
import { Table } from './entities/selling/table.entity';
//import { TableController } from './controllers/selling/table.controller';
//import { TableService } from './services/selling/table.service';
//import { Waiter } from './entities/selling/waiter.entity';
//import { WaiterController } from './controllers/selling/waiter.controlle';
//import { WaiterService } from './services/selling/waiter.service';
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

      Attribute,
      AttributeValue,
      Branch,
      BranchVariantToProduct,
      BranchToProduct,
      BundleToProduct,
      ProductOption,
      VariantToProduct,
      BranchToUser,
      Brand,
      Supplier,
      //Order,
      //OrderToProduct,
      //Consult,
      //ConsultType,
      //Doctor,
      /*Patient,
      Customer,
      InsuranceCompany,
      SaleToProduct,
      Sale,
      Waiter,
      ProductPrescription,
      PrescriptionGlassCharacteristic,
      SaleProductToAttribute,
      SalePayment,
      ConsultPrintingHistory,
      SalePrintingHistory,
      Treatment,
      SalePaymentPrintingHistory,
      AttributeToProduct,*/
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
    //TableController,
    ActionHistoryController,
    AttributeController,
    SystemController,
    BrandController,
    SupplierController,
    //OrderController,
    //ConsultController,
    //ConsultTypeController,
    //PatientController,
    //DoctorController,
    //CustomerController,
    //WaiterController,
    //InsuranceCompanyController,
    //SaleController,
    //TreatmentController,
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
    //TableService,
    AttributeService,
    //WaiterService,
    BranchToProductService,
    DefaultDataService,
    BrandService,
    SupplierService,
    //OrderService,
    //OrderSubscriber,
    //ConsultService,
    //ConsultSubscriber,
    //ConsultTypeService,
    //DoctorService,
    //DoctorSubscriber,
    //PatientService,
    //CustomerService,
    /*InsuranceCompanyService,
    SaleService,
    SaleSubscriber,
    SalePaymentService,
    //SalePaymentSubscriber,
    /TreatmentService,*/

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
