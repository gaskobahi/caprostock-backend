import { CreateEquipmentTypeDto } from 'src/core/dto/setting/create-equipment-type.dto';

// Default users
export const getDefaultEquipmentTypes = () => {
  return <CreateEquipmentTypeDto[]>[
    {
      name: 'cooker',
      displayName: 'Calibration',
    },
    {
      name: 'cooking',
      displayName: 'Cooking',
    },
    {
      name: 'shelling',
      displayName: 'Shelling',
    },
    {
      name: 'borma',
      displayName: 'Borma',
    },
    {
      name: 'falco',
      displayName: 'falco',
    },
    {
      name: 'colorsorter',
      displayName: 'Color Sorter',
    },
    {
      name: 'peeling',
      displayName: 'Peeling',
    },
    {
      name: 'grading',
      displayName: 'Grading',
    },
    {
      name: 'packing',
      displayName: 'Packing',
    },
    {
      name: 'boiler',
      displayName: 'Boiler',
    },
  ];
};
