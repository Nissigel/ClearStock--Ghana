import { Redirect, useLocalSearchParams } from 'expo-router';
import type { OtpPurpose } from '@/types/auth.types';

export default function ResetPinOtpScreen() {
  const { phoneNumber } = useLocalSearchParams<{
    phoneNumber: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: '/(auth)/otp',
        params: { phoneNumber, purpose: 'PIN_RESET' as OtpPurpose },
      }}
    />
  );
}