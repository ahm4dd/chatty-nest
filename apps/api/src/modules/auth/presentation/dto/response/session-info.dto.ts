export interface SessionInfoDto {
  id: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}
