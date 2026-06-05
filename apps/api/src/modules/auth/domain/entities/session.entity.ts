export class Session {
  readonly #id: string;
  readonly #userId: string;
  readonly #token: string;
  readonly #expiresAt: Date;
  readonly #ipAddress: string | null;
  readonly #userAgent: string | null;
  readonly #createdAt: Date;

  private constructor(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress: string | null,
    userAgent: string | null,
    createdAt: Date,
  ) {
    this.#id = id;
    this.#userId = userId;
    this.#token = token;
    this.#expiresAt = expiresAt;
    this.#ipAddress = ipAddress;
    this.#userAgent = userAgent;
    this.#createdAt = createdAt;
  }

  static create(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Session {
    return new Session(id, userId, token, expiresAt, ipAddress ?? null, userAgent ?? null, new Date());
  }

  static reconstitute(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress: string | null,
    userAgent: string | null,
    createdAt: Date,
  ): Session {
    return new Session(id, userId, token, expiresAt, ipAddress, userAgent, createdAt);
  }

  get isValid(): boolean {
    return this.#expiresAt > new Date();
  }

  get isExpired(): boolean {
    return this.#expiresAt <= new Date();
  }

  belongsToUser(userId: string): boolean {
    return this.#userId === userId;
  }

  get id(): string {
    return this.#id;
  }

  get userId(): string {
    return this.#userId;
  }

  get token(): string {
    return this.#token;
  }

  get expiresAt(): Date {
    return this.#expiresAt;
  }

  get ipAddress(): string | null {
    return this.#ipAddress;
  }

  get userAgent(): string | null {
    return this.#userAgent;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }
}
