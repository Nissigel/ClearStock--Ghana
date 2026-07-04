export interface SendOtpRequest {
  phoneNumber: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface CreatePinRequest {
  tempToken: string;
  pin: string;
}

export interface LoginRequest {
  phoneNumber: string;
  pin: string;
}

export interface ResetPinRequest {
  resetToken: string;
  newPin: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  profilePhotoUrl: string | null;
  region: string;
  cityTown: string;
  accountStatus: AccountStatus;
  hasSellerProfile: boolean;
}

export type OtpPurpose =
  | 'REGISTRATION'
  | 'LOGIN'
  | 'PHONE_CHANGE'
  | 'PIN_RESET';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED';