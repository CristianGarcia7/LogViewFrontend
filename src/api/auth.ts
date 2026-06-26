import apiClient from './client';
import type { AuthTokensResponseDto, LoginUserDto } from './types';

export async function login(
  email: string,
  password: string,
): Promise<AuthTokensResponseDto> {
  const response = await apiClient.post<AuthTokensResponseDto>('/auth/login', {
    email,
    password,
  });
  return response.data;
}

export async function refresh(
  refreshToken: string,
): Promise<AuthTokensResponseDto> {
  const response = await apiClient.post<AuthTokensResponseDto>(
    '/auth/refresh',
    { refreshToken },
  );
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function me(): Promise<LoginUserDto> {
  const response = await apiClient.get<LoginUserDto>('/auth/me');
  return response.data;
}
