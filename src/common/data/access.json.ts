import {
  AbilityActionEnum,
  AbilitySubjectEnum,
  AccessTypeEnum,
} from '../../core/definitions/enums';
import {
  AccessFieldPermissionsType,
  AccessPermissionsType,
} from '../../core/definitions/types';
import { CreateAccessDto } from '../../core/dto/user/create-access.dto';

// Default Front accesss
export const getDefaultAccesss = () => {
  return <CreateAccessDto[]>[
    // Administrateur
    {
      name: AccessTypeEnum.owner,
      displayName: 'Proprietaire',
      description: 'Proprietaire',
      adminPermission: true,
      permissions: <AccessPermissionsType>{manage:'all'},
      fieldPermissions: <AccessFieldPermissionsType>{},
    },

    // Gestionnaire de vente
    {
      name: AccessTypeEnum.manager,
      displayName: 'Gestionnaire de vente',
      description: 'Gestionnaire de vente',
      adminPermission: false,
      permissions: <AccessPermissionsType>{
        [AbilitySubjectEnum.User]: false,
        [AbilitySubjectEnum.Branch]:false,
        [AbilitySubjectEnum.Product]:false,
        [AbilitySubjectEnum.Order]: true,
        [AbilitySubjectEnum.Sale]:true,
        [AbilitySubjectEnum.SalePayment]:false,
        [AbilitySubjectEnum.Supplier]:false,
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
          [AbilitySubjectEnum.Product]:false,
          [AbilitySubjectEnum.Order]:false,
          },
        fieldPermissions: <AccessFieldPermissionsType>{},
      },
  ];
};
