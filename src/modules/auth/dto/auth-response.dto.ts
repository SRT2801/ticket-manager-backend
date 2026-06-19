import { UserRole } from '../../../common/enums/user-role.enum';

export class AuthResponseDto {
  accessToken!: string;
  user!: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
  };
}
