import { AggregateRoot } from '../../../../shared-kernal/domain/aggregates/root.aggregate';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { Username } from '../value-objects/username.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserBannedEvent } from '../events/user-banned.event';
import { UserUnbannedEvent } from '../events/user-unbanned.event';
import { UserEmailVerifiedEvent } from '../events/user-email-verified.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  lang?: string;
  timezone?: string;
  notifications?: boolean;
}

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
  username: string;
  displayUsername: string;
  displayName: string | null;
  bio: string | null;
  preferences: UserPreferences | null;
  emailVerified: boolean;
  image: string | null;
  role: RoleType;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  readonly #id: string;
  #name: string;
  readonly #email: string;
  readonly #username: string;
  #displayUsername: string;
  #displayName: string | null;
  #bio: string | null;
  #preferences: UserPreferences;
  #emailVerified: boolean;
  #image: string | null;
  #role: RoleType;
  #banned: boolean;
  #banReason: string | null;
  #banExpires: Date | null;
  readonly #createdAt: Date;
  #updatedAt: Date;

  private constructor(props: {
    id: string;
    name: string;
    email: string;
    username: string;
    displayUsername: string;
    displayName: string | null;
    bio: string | null;
    preferences: UserPreferences;
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
    this.#id = props.id;
    this.#name = props.name;
    this.#email = props.email;
    this.#username = props.username;
    this.#displayUsername = props.displayUsername;
    this.#displayName = props.displayName;
    this.#bio = props.bio;
    this.#preferences = props.preferences;
    this.#emailVerified = props.emailVerified;
    this.#image = props.image;
    this.#role = props.role;
    this.#banned = props.banned;
    this.#banReason = props.banReason;
    this.#banExpires = props.banExpires;
    this.#createdAt = props.createdAt;
    this.#updatedAt = props.updatedAt;
  }

  static create(props: UserCreationProps): User {
    const now = new Date();
    const username = Username.fromEmail(props.email).value;
    const user = new User({
      id: props.id,
      name: props.name,
      email: props.email,
      username,
      displayUsername: username,
      displayName: props.name,
      bio: null,
      preferences: {},
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
      username: record.username,
      displayUsername: record.displayUsername,
      displayName: record.displayName,
      bio: record.bio,
      preferences: (record.preferences ?? {}) as UserPreferences,
      emailVerified: record.emailVerified,
      image: record.image,
      role: record.role,
      banned: record.banned,
      banReason: record.banReason,
      banExpires: record.banExpires,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  toRecord(): UserReconstitutionRecord {
    return {
      id: this.#id,
      name: this.#name,
      email: this.#email,
      username: this.#username,
      displayUsername: this.#displayUsername,
      displayName: this.#displayName,
      bio: this.#bio,
      preferences: this.#preferences,
      emailVerified: this.#emailVerified,
      image: this.#image,
      role: this.#role,
      banned: this.#banned,
      banReason: this.#banReason,
      banExpires: this.#banExpires,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
    };
  }

  get id(): string { return this.#id; }
  get name(): string { return this.#name; }
  get email(): string { return this.#email; }
  get username(): string { return this.#username; }
  get displayUsername(): string { return this.#displayUsername; }
  get displayName(): string | null { return this.#displayName; }
  get bio(): string | null { return this.#bio; }
  get preferences(): UserPreferences { return this.#preferences; }
  get emailVerified(): boolean { return this.#emailVerified; }
  get image(): string | null { return this.#image; }
  get role(): RoleType { return this.#role; }
  get banned(): boolean { return this.#banned; }
  get banReason(): string | null { return this.#banReason; }
  get banExpires(): Date | null { return this.#banExpires; }
  get createdAt(): Date { return this.#createdAt; }
  get updatedAt(): Date { return this.#updatedAt; }

  ban(reason: string, expires?: Date): void {
    if (this.#banned) return;
    this.#banned = true;
    this.#banReason = reason;
    this.#banExpires = expires ?? null;
    this.#updatedAt = new Date();

    this.addEvent(new UserBannedEvent(this.#id, reason, this.#banExpires));
  }

  unban(): void {
    if (!this.#banned) return;
    const previousBanReason = this.#banReason;
    this.#banned = false;
    this.#banReason = null;
    this.#banExpires = null;
    this.#updatedAt = new Date();

    this.addEvent(new UserUnbannedEvent(this.#id, previousBanReason));
  }

  verifyEmail(): void {
    if (this.#emailVerified) return;
    this.#emailVerified = true;
    this.#updatedAt = new Date();

    this.addEvent(new UserEmailVerifiedEvent(this.#id, this.#email));
  }

  updateProfile(data: { name?: string; image?: string | null }): void {
    if (data.name !== undefined) {
      this.#name = data.name;
      this.#displayName = data.name;
    }
    if (data.image !== undefined) this.#image = data.image;
    this.#updatedAt = new Date();

    this.addEvent(new UserProfileUpdatedEvent(this.#id, data));
  }

  changeRole(role: RoleType): void {
    const previousRole = this.#role;
    if (previousRole === role) return;
    this.#role = role;
    this.#updatedAt = new Date();

    this.addEvent(new UserRoleChangedEvent(this.#id, previousRole, role));
  }

  isActive(): boolean {
    if (!this.#banned) return true;
    if (this.#banExpires && this.#banExpires < new Date()) return true;
    return false;
  }

  isBanned(): boolean {
    return this.#banned;
  }
}
