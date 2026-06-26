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

export interface ProjectListItemDto {
  id: string;
  name: string;
  domain: string;
  sourceType: string;
  lastSyncedAt?: string | null;
}

export interface ProjectListResponseDto {
  items: ProjectListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export type LogType = 'access' | 'error';
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
