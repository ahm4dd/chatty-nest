import { RoleType, ROLE_HIERARCHY } from '../../../../shared-kernal/domain/value-objects/role.vo';

function normalize(roles: RoleType[]): RoleType[] {
  return [...new Set(roles)].sort(
    (a, b) => ROLE_HIERARCHY.indexOf(a) - ROLE_HIERARCHY.indexOf(b),
  );
}

export class Roles {
  readonly #roles: RoleType[];

  private constructor(roles: RoleType[]) {
    this.#roles = roles;
  }

  static create(roles?: RoleType[]): Roles {
    const normalized = normalize(roles ?? []);
    return new Roles(normalized.length > 0 ? normalized : ['USER']);
  }

  static reconstitute(roles: RoleType[]): Roles {
    const normalized = normalize(roles);
    if (normalized.length === 0) throw new Error('A user must have at least one role');
    return new Roles(normalized);
  }

  has(role: RoleType): boolean { return this.#roles.includes(role); }

  add(role: RoleType): Roles {
    if (this.#roles.includes(role)) return this;
    return new Roles(normalize([...this.#roles, role]));
  }

  remove(role: RoleType): Roles {
    if (!this.#roles.includes(role)) return this;
    const next = this.#roles.filter((r) => r !== role);
    if (next.length === 0) throw new Error('A user must have at least one role');
    return new Roles(next);
  }

  set(roles: RoleType[]): Roles {
    return Roles.reconstitute(roles);
  }

  toArray(): RoleType[] { return [...this.#roles]; }
  equals(other: Roles): boolean {
    if (this.#roles.length !== other.#roles.length) return false;
    return this.#roles.every((r, i) => r === other.#roles[i]);
  }
  get primary(): RoleType { return this.#roles[0] ?? 'USER'; }
  *[Symbol.iterator](): Iterator<RoleType> { yield* this.#roles; }
}
