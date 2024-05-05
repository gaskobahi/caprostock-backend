import { CreateLoyaltyDto } from 'src/core/dto/setting/create-loyalty.dto';

// Default users
export const getDefaultLoyalty = () => {
  return <CreateLoyaltyDto[]>[
    {
      uniqueName: 'bonussystem',
      displayName: 'Bonus',
      pointBalance: 0.0,
    },
  ];
};
