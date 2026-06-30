import apiClient from './client';
import type { ReadinessDetailDto } from './types';

export async function getSystemHealth(): Promise<ReadinessDetailDto> {
  const response = await apiClient.get<ReadinessDetailDto>(
    '/health/ready/detail',
  );
  return response.data;
}
