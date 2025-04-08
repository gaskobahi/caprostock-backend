import { AbilitySubjectEnum } from '../../core/definitions/enums';
import { EntityType, PermissionsType } from '../../core/definitions/types';
import { CreateAccessDto } from '../../core/dto/user/create-access.dto';

// Default Front accesss
export const getDefaultAccesss = () => {
  return <CreateAccessDto[]>[
    // Administrateur
    {
      name: 'default',
      entity: <EntityType>{
        [AbilitySubjectEnum.User]: false,
        [AbilitySubjectEnum.Branch]: false,
        [AbilitySubjectEnum.Product]: false,
        [AbilitySubjectEnum.Order]: false,
        [AbilitySubjectEnum.Selling]: false,
        [AbilitySubjectEnum.Customer]: false,
        [AbilitySubjectEnum.Supplier]: false,
        [AbilitySubjectEnum.Role]: false,
        [AbilitySubjectEnum.Reception]: false,
        [AbilitySubjectEnum.Department]: false,
        [AbilitySubjectEnum.Inventory]: false,
        [AbilitySubjectEnum.Setting]: false,
      },
      permissions: <PermissionsType>{
        create: false,
        read: false,
        edit: false,
        delete: false,
        stream: false,
      },
    },

    /*// Gestionnaire de vente
    {
      name: AccessTypeEnum.manager,
      displayName: 'Gestionnaire de vente',
      description: 'Gestionnaire de vente',
      adminPermission: false,
      permissions: <AccessPermissionsType>{
        [AbilitySubjectEnum.User]: false,
        [AbilitySubjectEnum.Branch]: false,
        [AbilitySubjectEnum.Product]: false,
        [AbilitySubjectEnum.Order]: true,
        [AbilitySubjectEnum.Sale]: true,
        [AbilitySubjectEnum.SalePayment]: false,
        [AbilitySubjectEnum.Supplier]: false,
      },
      fieldPermissions: <AccessFieldPermissionsType>{},
    },

    // Gestionnaire de vente
    {
      name: AccessTypeEnum.seller,
      displayName: 'Vendeur',
      description: 'Vendeur',
      adminPermission: false,
      permissions: <AccessPermissionsType>{
        [AbilitySubjectEnum.Product]: false,
        [AbilitySubjectEnum.Order]: false,
      },
      fieldPermissions: <AccessFieldPermissionsType>{},
    },*/
  ];
};
