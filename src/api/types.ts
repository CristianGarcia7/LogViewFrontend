// API types derived from swagger.json

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginUserDto {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
}

export interface AuthTokensResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface CreateUserRequestDto {
  email: string;
  password: string;
  role: 'admin' | 'viewer';
}

export interface UserResponseDto {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponseDto {
  items: UserResponseDto[];
  total: number;
  skip: number;
  take: number;
}

export type ProjectHealthStatus = 'ok' | 'warn' | 'error' | 'unknown';

export interface ProjectListItemDto {
  id: string;
  name: string;
  domain: string;
  sourceType: string;
  lastSyncedAt?: string | null;
  lastHealthStatus?: ProjectHealthStatus;
  lastCheckedAt?: string | null;
}

export interface ProjectListResponseDto {
  items: ProjectListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export type LogType = 'access' | 'error' | 'backend';
export type LogLevel = 'error' | 'warn' | 'notice' | 'info';

export interface LogsQueryParams {
  projectId: string;
  logType: LogType;
  lastLines?: number;
  text?: string;
  statusCode?: string;
  level?: LogLevel;
}

export interface LogEntryDto {
  raw: string;
  timestamp?: string;
  method?: string;
  path?: string;
  status?: number;
  level?: string;
  message?: string;
}

export interface LogsResponseDto {
  lines: LogEntryDto[];
  truncated: boolean;
  fetchedAt: string;
  source: string;
}

export interface ProjectDto {
  id: string;
  name: string;
  domain: string;
  sourceType: string;
  lastSyncedAt?: string | null;
}

export interface SyncResultDto {
  instancesScanned: number;
  instancesSkipped: number;
  synced: number;
  created: number;
  updated: number;
  rejected: number;
}

export interface HealthSweepResultDto {
  swept: number;
  ok: number;
  warn: number;
  error: number;
  skipped: boolean;
  durationMs: number;
}

export interface SslInfoDto {
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  expired: boolean;
  valid: boolean;
  issuer: string;
}

export interface HealthCheckResponseDto {
  reachable: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
  ssl: SslInfoDto | null;
  secure: boolean;
  reason?: string | null;
}

export interface BackendHealthDto {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
}

export interface DependencyStatusDto {
  healthy: boolean;
  reason?: string;
}

export interface ReadinessDetailDto {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
  checks: {
    database: DependencyStatusDto;
    aws: DependencyStatusDto;
  };
}
