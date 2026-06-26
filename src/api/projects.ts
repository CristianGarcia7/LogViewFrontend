import apiClient from './client';
import type { ProjectListResponseDto, ProjectDto } from './types';

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
