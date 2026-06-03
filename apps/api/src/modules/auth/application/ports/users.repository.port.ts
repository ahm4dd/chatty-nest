import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: RoleType;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  role?: RoleType;
}

export interface UsersRepositoryPort {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  exists(id: string): Promise<boolean>;
  existsAndActive(id: string): Promise<boolean>;
}
