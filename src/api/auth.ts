import apiClient from './client';
import type { LoginDto, LoginResponseDto, LoginUserDto } from './types';

export async function login(dto: LoginDto): Promise<LoginResponseDto> {
  const response = await apiClient.post<LoginResponseDto>('/auth/login', dto);
  return response.data;
}

export async function me(): Promise<LoginUserDto> {
  const response = await apiClient.get<LoginUserDto>('/auth/me');
  return response.data;
}
