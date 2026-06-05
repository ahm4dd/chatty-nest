import { User } from '../../domain/aggregates/user.aggregate';

export interface UsersRepositoryPort {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  exists(id: string): Promise<boolean>;
  existsAndActive(id: string): Promise<boolean>;
}
