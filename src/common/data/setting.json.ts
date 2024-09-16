import { SettingTypeEnum } from 'src/core/definitions/enums';
import { CreateSettingDto } from 'src/core/dto/setting/create-setting.dto';

// Default users
export const getDefaultSettings = () => {
  return <CreateSettingDto[]>[
    {
      name: 'feature',
      displayName: 'Fonctionalités',
      type: SettingTypeEnum.system,
      position: 0,
    },
    {
      name: 'tax',
      displayName: 'Taxes',
      type: SettingTypeEnum.system,
      position: 1,
    },
    {
      name: 'dining',
      displayName: 'Option de restauration',
      type: SettingTypeEnum.system,
      position: 2,
    },
    {
      name: 'loyalty',
      displayName: 'Fidélisation',
      type: SettingTypeEnum.system,
      position: 3,
    },
    {
      name: 'openticket',
      displayName: 'Tickets ouverts',
      type: SettingTypeEnum.system,
      position: 4,
    },
    {
      name: 'branch',
      displayName: 'Surccusale',
      type: SettingTypeEnum.store,
      position: 0,
    },
    {
      name: 'box',
      displayName: 'Caisse',
      type: SettingTypeEnum.store,
      position: 1,
    },
  ];
};
