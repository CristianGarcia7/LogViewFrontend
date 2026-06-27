import apiClient from './client';
import type { ProjectListResponseDto, ProjectDto, SyncResultDto, HealthCheckResponseDto } from './types';

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

export async function getProjectHealth(projectId: string): Promise<HealthCheckResponseDto> {
  const response = await apiClient.get<HealthCheckResponseDto>(
    `/projects/${projectId}/health`,
    { timeout: 30_000 }, // on-demand probe can be slow (10s+)
  );
  return response.data;
}
