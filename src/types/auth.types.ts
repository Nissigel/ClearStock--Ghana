export interface SendOtpRequest {
  phone: string;
  purpose: OtpPurpose;
  // Optional at sign-up: when present the backend emails the code here.
  email?: string;
}

export interface VerifyOtpResult {
  verified: boolean;
  // True when the phone already has an account — the caller should send the
  // user to login instead of creating a PIN (tempToken is null in that case).
  userExists: boolean;
  tempToken: string | null;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface CreatePinRequest {
  tempToken: string;
  pin: string;
  // Optional email captured at sign-up, saved on the new account.
  email?: string;
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