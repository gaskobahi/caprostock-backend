import { CreateSettingDto } from 'src/core/dto/setting/create-setting.dto';

// Default users
export const getDefaultSettings = () => {
  return <CreateSettingDto[]>[
    /*{
      name: 'feature',
      displayName: 'Fonctionalités',
    },
    {
      name: 'tax',
      displayName: 'Taxes',
    },
    {
      name: 'dining',
      displayName: 'Option de restauration',
    },
    {
      name: 'loyalty',
      displayName: 'Fidélisation',
    },
    {
      name: 'openticket',
      displayName: 'Tickets ouverts',
    },*/
    {
      name: 'branch',
      displayName: 'Surccusale',
    },
    {
      name: 'section',
      displayName: 'Section',
    },
    {
      name: 'equipmenttype',
      displayName: 'Type équipement',
    },
    {
      name: 'department',
      displayName: 'Departement',
    },
    {
      name: 'equipment',
      displayName: 'Equipement',
    },
  ];
};
