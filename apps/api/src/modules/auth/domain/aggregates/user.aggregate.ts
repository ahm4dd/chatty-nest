import { AggregateRoot } from '../../../../shared-kernal/domain/aggregates/root.aggregate';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserBannedEvent } from '../events/user-banned.event';
import { UserUnbannedEvent } from '../events/user-unbanned.event';
import { UserEmailVerifiedEvent } from '../events/user-email-verified.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';

export interface UserCreationProps {
  id: string;
  name: string;
  email: string;
  role?: RoleType;
}

export interface UserReconstitutionRecord {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: RoleType;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private _id: string;
  private _name: string;
  private _email: string;
  private _emailVerified: boolean;
  private _image: string | null;
  private _role: RoleType;
  private _banned: boolean;
  private _banReason: string | null;
  private _banExpires: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
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
  }) {
    super();
    this._id = props.id;
    this._name = props.name;
    this._email = props.email;
    this._emailVerified = props.emailVerified;
    this._image = props.image;
    this._role = props.role;
    this._banned = props.banned;
    this._banReason = props.banReason;
    this._banExpires = props.banExpires;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: UserCreationProps): User {
    const now = new Date();
    const user = new User({
      id: props.id,
      name: props.name,
      email: props.email,
      emailVerified: false,
      image: null,
      role: props.role ?? 'USER',
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: now,
      updatedAt: now,
    });

    user.addEvent(
      new UserCreatedEvent(props.id, props.email, props.name, props.role ?? 'USER'),
    );

    return user;
  }

  static from(record: UserReconstitutionRecord): User {
    return new User({
      id: record.id,
      name: record.name,
      email: record.email,
      emailVerified: record.emailVerified,
      image: record.image,
      role: record.role,
      banned: record.banned ?? false,
      banReason: record.banReason,
      banExpires: record.banExpires,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get image(): string | null {
    return this._image;
  }

  get role(): RoleType {
    return this._role;
  }

  get banned(): boolean {
    return this._banned;
  }

  get banReason(): string | null {
    return this._banReason;
  }

  get banExpires(): Date | null {
    return this._banExpires;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  ban(reason: string, expires?: Date): void {
    if (this._banned) return;
    this._banned = true;
    this._banReason = reason;
    this._banExpires = expires ?? null;
    this._updatedAt = new Date();

    this.addEvent(new UserBannedEvent(this._id, reason, this._banExpires));
  }

  unban(): void {
    if (!this._banned) return;
    const previousBanReason = this._banReason;
    this._banned = false;
    this._banReason = null;
    this._banExpires = null;
    this._updatedAt = new Date();

    this.addEvent(new UserUnbannedEvent(this._id, previousBanReason));
  }

  verifyEmail(): void {
    if (this._emailVerified) return;
    this._emailVerified = true;
    this._updatedAt = new Date();

    this.addEvent(new UserEmailVerifiedEvent(this._id, this._email));
  }

  updateProfile(data: { name?: string; image?: string | null }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.image !== undefined) this._image = data.image;
    this._updatedAt = new Date();

    this.addEvent(new UserProfileUpdatedEvent(this._id, data));
  }

  changeRole(role: RoleType): void {
    const previousRole = this._role;
    if (previousRole === role) return;
    this._role = role;
    this._updatedAt = new Date();

    this.addEvent(new UserRoleChangedEvent(this._id, previousRole, role));
  }

  isActive(): boolean {
    if (!this._banned) return true;
    if (this._banExpires && this._banExpires < new Date()) return true;
    return false;
  }

  isBanned(): boolean {
    return this._banned;
  }
}
