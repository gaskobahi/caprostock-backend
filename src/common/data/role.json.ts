import { RolePermissionsType } from '../../core/definitions/types';
import { CreateRoleDto } from '../../core/dto/user/create-role.dto';

// Default Front roles
export const getDefaultRoles = () => {
  return <CreateRoleDto[]>[
    // Administrateur
    {
      name: 'admin',
      displayName: 'Administrateur',
      isActive: true,
      description: 'Administrateur',
      adminPermission: true,
      permissions: <RolePermissionsType>{},
    },
    {
      name: 'owner',
      displayName: 'Administrateur',
      isActive: true,
      description: 'Administrateur',
      adminPermission: true,
      permissions: <RolePermissionsType>{},
    },

    // Gestionnaire de vente
    {
      name: 'manager',
      displayName: 'Gestionnaire de vente',
      isActive: true,
      description: 'Gestionnaire de vente',
      adminPermission: false,
      permissions: <RolePermissionsType>{},
    },

    // Gestionnaire de vente
    {
      name: 'seller',
      displayName: 'Vendeur',
      isActive: true,
      description: 'Vendeur',
      adminPermission: false,
      permissions: <RolePermissionsType>{},
    },

    /*[AbilitySubjectEnum.User]: {
      [AbilityActionEnum.read]: true,
      [AbilityActionEnum.create]: true,
      [AbilityActionEnum.edit]: true,
      [AbilityActionEnum.delete]: true,
    },
    [AbilitySubjectEnum.Branch]: {
      [AbilityActionEnum.read]: true,
      [AbilityActionEnum.create]: true,
      [AbilityActionEnum.edit]: true,
      [AbilityActionEnum.delete]: true,
      [AbilityActionEnum.stream]: true,
    },
    [AbilitySubjectEnum.Product]: {
      [AbilityActionEnum.read]: true,
      [AbilityActionEnum.create]: true,
      [AbilityActionEnum.edit]: true,
      [AbilityActionEnum.delete]: true,
      [AbilityActionEnum.stream]: true,
    },*/
  ];
};
