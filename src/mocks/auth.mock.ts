import type { AuthResponse, AuthUser } from '@/types/auth.types';

export const MOCK_AUTH_USER: AuthUser = {
  id: 'user-001',
  fullName: 'Ama Mensah',
  phoneNumber: '0241234567',
  email: 'ama.mensah@gmail.com',
  profilePhotoUrl: null,
  region: 'Greater Accra',
  cityTown: 'Accra',
  accountStatus: 'ACTIVE',
};

export const MOCK_AUTH_USER_WITH_SELLER: AuthUser = {
  id: 'user-002',
  fullName: 'Kofi Boateng',
  phoneNumber: '0551234567',
  email: null,
  profilePhotoUrl: null,
  region: 'Ashanti',
  cityTown: 'Kumasi',
  accountStatus: 'ACTIVE',
};

export const MOCK_AUTH_RESPONSE: AuthResponse = {
  token: 'mock-jwt-token-001',
  user: MOCK_AUTH_USER,
};

export const MOCK_OTP = '123456';
export const MOCK_PIN = '1234';