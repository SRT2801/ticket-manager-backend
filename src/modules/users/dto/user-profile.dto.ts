import { UserRole } from '../../../common/enums/user-role.enum';

export class UserProfileDto {
  id!: number;
  email!: string;
  name!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}
