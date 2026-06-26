import apiClient from './client';
import type { LogsQueryParams, LogsResponseDto } from './types';

export async function getLogs(params: LogsQueryParams): Promise<LogsResponseDto> {
  const { projectId, logType, lastLines, text, statusCode, level } = params;
  const response = await apiClient.get<LogsResponseDto>('/logs', {
    params: {
      projectId,
      logType,
      ...(lastLines !== undefined ? { lastLines } : {}),
      ...(text ? { text } : {}),
      ...(statusCode ? { statusCode } : {}),
      ...(level ? { level } : {}),
    },
  });
  return response.data;
}
