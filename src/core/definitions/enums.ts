export enum YesNoActionEnum {
  yes = 'yes',
  no = 'no',
}

export enum AbilitySubjectEnum {
  all = 'all',
  User = 'User',
  Branch = 'Branch',
  Product = 'Product',
  Attribute = 'Attribute',
  Role = 'Role',
  Modifier = 'Modifier',
  AuthUser = 'AuthUser',
  Brand = 'Brand',
  Supplier = 'Supplier',
  Order = 'Order',
  Consult = 'Consult',
  ConsultType = 'ConsultType',
  Doctor = 'Doctor',
  Patient = 'Patient',
  Customer = 'Customer',
  Waiter = 'Waiter',
  InsuranceCompany = 'InsuranceCompany',
  Sale = 'Sale',
  SalePayment = 'SalePayment',
  Treatment = 'Treatment',
}

export enum AbilityActionEnum {
  admin = 'admin',
  manage = 'manage',
  read = 'read',
  create = 'create',
  edit = 'edit',
  delete = 'delete',
  stream = 'stream',
}

/**
 * Product *******************************
 */
export enum ProductTypeEnum {
  // Repas
  food = 'food',
  // boissons
  drink = 'drink',
  // Autres
  other = 'other',
}

export enum AccessTypeEnum {
  // Owner
  owner = 'owner',
  // Manager
  manager = 'manager',
  // Seller
  seller = 'seller',
}




export enum ProductSoldByEnum {
  // par Chaque
  each = 'each',
  // par poids/volume
  weight = 'weight',
}

export enum ProductsymbolTypeEnum {
  // par Image
  image = 'image',
  // par couleur et symbole
  colorShape = 'colorShape',
}

export enum CategoryTypeEnum {
  // Repas
  soft_drink = 'soft_drink',
  // boissons
  alcoholic_drink = 'alcoholic_drink',
}

export enum ProductTypeEnum {
  // Repas
  soft_drink = 'soft_drink',
  // boissons
  eyeglassFrame = 'eyeglassFrame',
}

/**
 * Order *******************************
 */
export enum OrderSourceEnum {
  supplier = 'supplier',
  branch = 'branch',
}
export enum OrderStatusEnum {
  init = 'init',
  validated = 'validated',
  cancelled = 'cancelled',
}

/**
 * AuthLog *******************************
 */
export enum AuthLogAuthMethodEnum {
  local = 'local',
  jwt = 'jwt',
}

/**
 * Consultation *******************************
 */
export enum ConsultStatusEnum {
  init = 'init',
  inProgress = 'in_progress',
  closed = 'closed',
}
