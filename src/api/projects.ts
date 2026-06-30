import apiClient from './client';
import type {
  ProjectListResponseDto,
  ProjectDto,
  SyncResultDto,
  HealthCheckResponseDto,
  HealthSweepResultDto,
} from './types';

export async function listProjects(
  params: { page?: number; pageSize?: number; search?: string } = {},
): Promise<ProjectListResponseDto> {
  const { page = 1, pageSize = 24, search } = params;
  const response = await apiClient.get<ProjectListResponseDto>('/projects', {
    params: {
      page,
      pageSize,
      ...(search && search.trim() ? { search: search.trim() } : {}),
    },
  });
  return response.data;
}

export async function getProject(id: string): Promise<ProjectDto> {
  const response = await apiClient.get<ProjectDto>(`/projects/${id}`);
  return response.data;
}

export async function syncProjects(): Promise<SyncResultDto> {
  const response = await apiClient.post<SyncResultDto>(
    '/projects/sync',
    undefined,
    { timeout: 120_000 }, // sync is synchronous and slow (~60s); allow up to 2 min
  );
  return response.data;
}

export async function runHealthSweep(): Promise<HealthSweepResultDto> {
  const response = await apiClient.post<HealthSweepResultDto>(
    '/projects/health-sweep',
    undefined,
    { timeout: 120_000 }, // sweep is synchronous and slow (~48s); allow up to 2 min
  );
  // Caller is responsible for distinguishing a 409 (sweep already in flight,
  // see ConflictException on the backend) from other errors via err.response?.status,
  // mirroring how syncProjects() callers inspect status codes — no special handling here.
  return response.data;
}

export async function getProjectHealth(projectId: string): Promise<HealthCheckResponseDto> {
  const response = await apiClient.get<HealthCheckResponseDto>(
    `/projects/${projectId}/health`,
    { timeout: 30_000 }, // on-demand probe can be slow (10s+)
  );
  return response.data;
}
