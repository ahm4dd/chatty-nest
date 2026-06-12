export const BAN_ACTIONS = {
  BANNED: 'BANNED',
  UNBANNED: 'UNBANNED',
} as const;

export type BanAction = (typeof BAN_ACTIONS)[keyof typeof BAN_ACTIONS];
