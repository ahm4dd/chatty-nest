import { BanLogEntry } from './ban-log-entry.entity';

describe('BanLogEntry', () => {
  describe('createBan', () => {
    it('creates a BANNED entry', () => {
      const entry = BanLogEntry.createBan('id-1', 'user-1', 'spam');
      expect(entry.action).toBe('BANNED');
      expect(entry.userId).toBe('user-1');
      expect(entry.reason).toBe('spam');
      expect(entry.expiresAt).toBeNull();
    });

    it('accepts optional expiresAt', () => {
      const future = new Date(Date.now() + 86400000);
      const entry = BanLogEntry.createBan('id-1', 'user-1', 'spam', future, 'admin-1');
      expect(entry.expiresAt).toEqual(future);
      expect(entry.createdBy).toBe('admin-1');
    });

    it('rejects past expiresAt', () => {
      const past = new Date(Date.now() - 1000);
      expect(() => BanLogEntry.createBan('id-1', 'user-1', 'spam', past))
        .toThrow('expiresAt must be in the future');
    });
  });

  describe('createUnban', () => {
    it('creates an UNBANNED entry', () => {
      const entry = BanLogEntry.createUnban('id-2', 'user-1', 'appealed', 'admin-1');
      expect(entry.action).toBe('UNBANNED');
      expect(entry.reason).toBe('appealed');
      expect(entry.expiresAt).toBeNull();
      expect(entry.createdBy).toBe('admin-1');
    });
  });

  describe('reconstitute', () => {
    it('recreates a BANNED entry from a record', () => {
      const record = {
        id: 'id-1', userId: 'user-1', action: 'BANNED' as const,
        reason: 'spam', expiresAt: null, createdBy: 'admin-1',
        createdAt: new Date(),
      };
      const entry = BanLogEntry.reconstitute(record);
      expect(entry.action).toBe('BANNED');
      expect(entry.reason).toBe('spam');
    });

    it('throws on UNBANNED entry with expiresAt', () => {
      const record = {
        id: 'id-1', userId: 'user-1', action: 'UNBANNED' as const,
        reason: null, expiresAt: new Date(), createdBy: null,
        createdAt: new Date(),
      };
      expect(() => BanLogEntry.reconstitute(record))
        .toThrow('UNBANNED action must not have expiresAt');
    });
  });

  describe('toRecord', () => {
    it('round-trips through reconstitute', () => {
      const original = BanLogEntry.createBan('id-1', 'user-1', 'spam', undefined, 'admin-1');
      const record = original.toRecord();
      const restored = BanLogEntry.reconstitute(record);
      expect(restored.id).toBe(original.id);
      expect(restored.userId).toBe(original.userId);
      expect(restored.action).toBe(original.action);
      expect(restored.reason).toBe(original.reason);
    });
  });

  describe('isActive', () => {
    it('returns true for a BANNED entry without expiry', () => {
      const entry = BanLogEntry.createBan('id-1', 'user-1', 'spam');
      expect(entry.isActive()).toBe(true);
    });

    it('returns true for a BANNED entry with future expiry', () => {
      const future = new Date(Date.now() + 86400000);
      const entry = BanLogEntry.createBan('id-1', 'user-1', 'spam', future);
      expect(entry.isActive()).toBe(true);
    });

    it('returns false for a BANNED entry with past expiry', () => {
      const past = new Date(Date.now() - 1000);
      const entry = BanLogEntry.reconstitute({
        id: 'id-1', userId: 'user-1', action: 'BANNED' as const,
        reason: 'spam', expiresAt: past, createdBy: null,
        createdAt: new Date(),
      });
      expect(entry.isActive()).toBe(false);
    });

    it('returns false for an UNBANNED entry', () => {
      const entry = BanLogEntry.createUnban('id-2', 'user-1');
      expect(entry.isActive()).toBe(false);
    });
  });
});
