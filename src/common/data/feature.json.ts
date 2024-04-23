import { CreateFeatureDto } from 'src/core/dto/setting/create-feature.dto';

// Default users
export const getDefaultFeatures = () => {
  return <CreateFeatureDto[]>[
    {
      pseudoName: 'diningoptions',
      displayName: 'Options de restauration',
      description: 'Passer commande sur place, à emporter ou en livraison',
      isEnable: false,
    },
  ];
};
