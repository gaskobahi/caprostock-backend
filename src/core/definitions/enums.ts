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
  Transporter = 'Transporter',
  Tax = 'Tax',
  Feature = 'Feature',
  AuthUser = 'AuthUser',
  Brand = 'Brand',
  Supplier = 'Supplier',
  Order = 'Order',
  Selling = 'Selling',
  Reception = 'Reception',
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
  Department = 'Department',
  Equipment = 'Equipment',
  EquipmentType = 'EquipmentType',
  Section = 'Section',

  Reason = 'Reason',
  OpenTicket = 'OpenTicket',
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

export enum TaxTypeEnum {
  // Inclut dans dans le prix
  includeInPrice = 'includeInPrice',
  // Ajouter au prix
  addedInPrice = 'addedInPrice',
}

export enum TaxOptionEnum {
  applyToNewItems = 'applyToNewItems',
  applyToExitingItems = 'applyToExitingItems',
  applyToNewAndExitingItems = 'applyToNewAndExitingItems',
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

export enum DiscountTypeEnum {
  // par Pourcentage
  percentage = 'percentage',
  // par montant
  amount = 'amount',
}

export enum ProductsymbolTypeEnum {
  // par Image
  image = 'image',
  // par couleur et symbole
  colorShape = 'colorShape',
}

export enum SettingTypeEnum {
  store = 'store',
  system = 'system',
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
  draft = 'draft',
  pending = 'pending',
  partialreceived = 'partialreceived',
  closed = 'closed',
}

export enum SellingStatusEnum {
  draft = 'draft',
  pending = 'pending',
  partialdelivered = 'partialdelivered',
  closed = 'closed',
}

export enum CorderStatusEnum {
  draft = 'draft',
  pending = 'pending',
  partialreceived = 'partialreceived',
  closed = 'closed',
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

export enum DefaultReasonTypeEnum {
  receiveItem = 'receiveItem',
  loss = 'loss',
  inventoryCount = 'inventoryCount',
  damage = 'damage',
}

export enum DefaultTransferOrderTypeEnum {
  intransit = 'intransit',
  transfered = 'transfered',
}

export enum InventoryCountTypeEnum {
  partial = 'partial',
  full = 'full',
}

export enum InventoryCountStatusEnum {
  pending = 'pending',
  inProgress = 'in_progress',
  completed = 'completed',
}

export enum ProductionStatusEnum {
  production = 'production',
  disassembly = 'disassembly',
}
