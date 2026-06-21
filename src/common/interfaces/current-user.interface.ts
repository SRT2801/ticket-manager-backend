import { User } from '../../modules/users/entities/user.entity';

export type CurrentUserPayload = Pick<User, 'id' | 'role'> & { name?: string };
