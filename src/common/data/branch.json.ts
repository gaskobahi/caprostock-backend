import { CreateBranchDto } from 'src/core/dto/subsidiary/create-branch.dto';

// Default users
export const getDefaultBranches = () => {
  return <CreateBranchDto[]>[
    {
      displayName: 'Maison mère',
      city: 'Abidjan',
      isActive: true,
      isParentCompany: true,
    },
  ];
};
