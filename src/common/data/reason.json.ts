import { CreateReasonDto } from 'src/core/dto/stockmanagement/create-reason.dto';

// Default Reasons
export const getDefaultReasons = () => {
  return <CreateReasonDto[]>[
    {
      name: 'receiveItem',
      displayName: `Réception d'article`,
      position: 0,
    },
    {
      name: 'inventoryCount',
      displayName: `Inventaire de stock`,
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
