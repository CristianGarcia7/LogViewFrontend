import apiClient from './client';
import type { ProjectListResponseDto, ProjectDto } from './types';

export async function listProjects(
  page = 1,
  pageSize = 50,
): Promise<ProjectListResponseDto> {
  const response = await apiClient.get<ProjectListResponseDto>('/projects', {
    params: { page, pageSize },
  });
  return response.data;
}

export async function getProject(id: string): Promise<ProjectDto> {
  const response = await apiClient.get<ProjectDto>(`/projects/${id}`);
  return response.data;
}
