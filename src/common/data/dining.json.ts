import { CreateDiningDto } from 'src/core/dto/setting/create-dining.dto';

// Default users
export const getDefaultDinings = () => {
  return <CreateDiningDto[]>[
    {
      displayName: 'Dinein',
    },
    {
      displayName: 'Takeout',
    },
    {
      displayName: 'Delivery',
    },
  ];
};
