import { CreateTreatmentDto } from 'src/core/dto/selling/create-treatment.dto';

// Default treatments
export const getDefaultTreatments = () => {
  return <CreateTreatmentDto[]>[
    { displayName: 'Blanc' },
    { displayName: 'Anti-reflet' },
    { displayName: 'Photogray' },
    { displayName: 'Anti-reflet bleu' },
    { displayName: 'Anti-reflet vert' },
    { displayName: 'Anti-lumière bleu' },
    { displayName: 'Teinte' },
  ];
};
