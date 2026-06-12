import { AggregateRoot } from '../../../../shared-kernal/domain/aggregates/root.aggregate';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { Username } from '../value-objects/username.vo';
import { Roles } from '../value-objects/roles.vo';
import { UserCreatedEvent } from '../events/user-created.event';
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
  roles?: RoleType[];
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
  roles: RoleType[];
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
  #roles: Roles;
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
    roles: Roles;
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
    this.#roles = props.roles;
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
      roles: Roles.create(props.roles),
      createdAt: now,
      updatedAt: now,
    });

    user.addEvent(
      new UserCreatedEvent(props.id, props.email, props.name, user.#roles.primary),
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
      roles: Roles.reconstitute(record.roles),
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
      roles: [...this.#roles],
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
  get roles(): RoleType[] { return this.#roles.toArray(); }
  get createdAt(): Date { return this.#createdAt; }
  get updatedAt(): Date { return this.#updatedAt; }

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

  hasRole(role: RoleType): boolean {
    return this.#roles.has(role);
  }

  addRole(role: RoleType): void {
    const previousRoles = this.#roles;
    this.#roles = this.#roles.add(role);
    if (this.#roles.equals(previousRoles)) return;
    this.#updatedAt = new Date();
    this.addEvent(new UserRoleChangedEvent(this.#id, previousRoles.toArray(), this.#roles.toArray()));
  }

  removeRole(role: RoleType): void {
    const previousRoles = this.#roles;
    this.#roles = this.#roles.remove(role);
    if (this.#roles.equals(previousRoles)) return;
    this.#updatedAt = new Date();
    this.addEvent(new UserRoleChangedEvent(this.#id, previousRoles.toArray(), this.#roles.toArray()));
  }

  setRoles(roles: RoleType[]): void {
    const previousRoles = this.#roles;
    this.#roles = this.#roles.set(roles);
    if (this.#roles.equals(previousRoles)) return;
    this.#updatedAt = new Date();
    this.addEvent(new UserRoleChangedEvent(this.#id, previousRoles.toArray(), this.#roles.toArray()));
  }
}
