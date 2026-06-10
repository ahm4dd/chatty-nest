export class Username {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  static fromEmail(email: string): Username {
    return Username.fromRaw(email.split('@')[0] ?? email);
  }

  static fromRaw(value: string): Username {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return new Username(normalized || 'user');
  }

  withSuffix(suffix: string): Username {
    return Username.fromRaw(`${this.#value}${suffix}`);
  }

  get value(): string {
    return this.#value;
  }
}
