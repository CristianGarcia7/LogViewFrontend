import apiClient from './client';
import type {
  CreateUserRequestDto,
  UserListResponseDto,
  UserResponseDto,
} from './types';

export async function listUsers(params?: {
  take?: number;
  skip?: number;
}): Promise<UserListResponseDto> {
  const response = await apiClient.get<UserListResponseDto>('/users', {
    params,
  });
  return response.data;
}

export async function createUser(
  body: CreateUserRequestDto,
): Promise<UserResponseDto> {
  const response = await apiClient.post<UserResponseDto>('/users', body);
  return response.data;
}
