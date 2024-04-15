import { CreateUserDto } from 'src/core/dto/user/create-user.dto';

// Default users
export const getDefaultUsers = () => {
  return <CreateUserDto[]>[
    {
      username: 'admin',
      newPassword: 'admin',
      email: 'admin@localhost',
      isActive: true,
      firstName: 'Bahi Boris',
      lastName: 'BAHI',
    },
  ];
};
