import apiClient from './client';
import type { InstanceDto, LogsResponseDto, SystemLogsQueryParams } from './types';

export async function getInstances(): Promise<InstanceDto[]> {
  const response = await apiClient.get<InstanceDto[]>('/instances');
  return response.data;
}

export async function getSystemLogs(params: SystemLogsQueryParams): Promise<LogsResponseDto> {
  const { instanceId, logType, lastLines, text, level } = params;
  const response = await apiClient.get<LogsResponseDto>('/system-logs', {
    params: {
      instanceId,
      logType,
      ...(lastLines !== undefined ? { lastLines } : {}),
      ...(text ? { text } : {}),
      ...(level ? { level } : {}),
    },
  });
  return response.data;
}
