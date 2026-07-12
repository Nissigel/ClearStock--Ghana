export interface SendOtpRequest {
  phone: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface CreatePinRequest {
  tempToken: string;
  pin: string;
}

export interface LoginRequest {
  phone: string;
  pin: string;
}

export interface ResetPinRequest {
  phone: string;
  otp: string;
  newPin: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  profilePhotoUrl: string | null;
  // Not returned by GET /user/profile — only present via mocks until the
  // backend adds them. See src/api/auth.api.ts getMyProfile.
  region?: string;
  cityTown?: string;
  accountStatus?: AccountStatus;
  // Whether the user opts into email notifications (backend: preferEmail).
  emailNotifications?: boolean;
}

export type OtpPurpose =
  | 'REGISTRATION'
  | 'LOGIN'
  | 'PHONE_CHANGE'
  | 'PIN_RESET';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED';