import { CreateSectionDto } from 'src/core/dto/setting/create-section.dto';

// Default users
export const getDefaultSections = () => {
  return <CreateSectionDto[]>[
    {
      name: 'calibration',
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
