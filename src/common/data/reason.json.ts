import { CreateReasonDto } from 'src/core/dto/stockmanagement/create-reason.dto';

// Default Reasons
export const getDefaultReasons = () => {
  return <CreateReasonDto[]>[
    {
      name: 'receiveItem',
      displayName: `Reception d'article`,
      position: 0,
    },
    {
      name: 'inventoryAccount',
      displayName: `Inventaire de compte`,
      position: 1,
    },
    {
      name: `loss`,
      displayName: 'Perte',
      position: 2,
    },
    {
      name: 'damage',
      displayName: 'Endommager',
      position: 3,
    },
  ];
};
