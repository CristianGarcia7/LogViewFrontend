import apiClient from './client';
import type { LogsQueryParams, LogsResponseDto } from './types';

export async function getLogs(params: LogsQueryParams): Promise<LogsResponseDto> {
  const { projectId, ...rest } = params;
  const response = await apiClient.get<LogsResponseDto>(
    `/projects/${projectId}/logs`,
    { params: rest },
  );
  return response.data;
}
