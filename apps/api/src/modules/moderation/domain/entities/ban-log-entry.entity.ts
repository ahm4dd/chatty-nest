import { BanAction, BAN_ACTIONS } from '../../../../shared-kernal/domain/value-objects/ban-action.vo';

export interface BanLogEntryReconstitutionRecord {
  id: string;
  userId: string;
  action: BanAction;
  reason: string | null;
  expiresAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
}

export class BanLogEntry {
  readonly #id: string;
  readonly #userId: string;
  readonly #action: BanAction;
  readonly #reason: string | null;
  readonly #expiresAt: Date | null;
  readonly #createdBy: string | null;
  readonly #createdAt: Date;

  private constructor(
    id: string,
    userId: string,
    action: BanAction,
    reason: string | null,
    expiresAt: Date | null,
    createdBy: string | null,
    createdAt: Date,
  ) {
    this.#id = id;
    this.#userId = userId;
    this.#action = action;
    this.#reason = reason;
    this.#expiresAt = expiresAt;
    this.#createdBy = createdBy;
    this.#createdAt = createdAt;
  }

  static createBan(
    id: string,
    userId: string,
    reason?: string,
    expiresAt?: Date,
    createdBy?: string,
  ): BanLogEntry {
    if (expiresAt && expiresAt <= new Date()) {
      throw new Error('expiresAt must be in the future');
    }

    return new BanLogEntry(
      id,
      userId,
      BAN_ACTIONS.BANNED,
      reason ?? null,
      expiresAt ?? null,
      createdBy ?? null,
      new Date(),
    );
  }

  static createUnban(
    id: string,
    userId: string,
    reason?: string,
    createdBy?: string,
  ): BanLogEntry {
    return new BanLogEntry(
      id,
      userId,
      BAN_ACTIONS.UNBANNED,
      reason ?? null,
      null,
      createdBy ?? null,
      new Date(),
    );
  }

  static reconstitute(record: BanLogEntryReconstitutionRecord): BanLogEntry {
    if (record.action === BAN_ACTIONS.UNBANNED && record.expiresAt !== null) {
      throw new Error('UNBANNED action must not have expiresAt');
    }

    return new BanLogEntry(
      record.id,
      record.userId,
      record.action,
      record.reason,
      record.expiresAt,
      record.createdBy,
      record.createdAt,
    );
  }

  isActive(): boolean {
    return this.#action === BAN_ACTIONS.BANNED && (this.#expiresAt === null || this.#expiresAt > new Date());
  }

  toRecord(): BanLogEntryReconstitutionRecord {
    return {
      id: this.#id,
      userId: this.#userId,
      action: this.#action,
      reason: this.#reason,
      expiresAt: this.#expiresAt,
      createdBy: this.#createdBy,
      createdAt: this.#createdAt,
    };
  }

  get id(): string { return this.#id; }
  get userId(): string { return this.#userId; }
  get action(): BanAction { return this.#action; }
  get reason(): string | null { return this.#reason; }
  get expiresAt(): Date | null { return this.#expiresAt; }
  get createdBy(): string | null { return this.#createdBy; }
  get createdAt(): Date { return this.#createdAt; }
}
