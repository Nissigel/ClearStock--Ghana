import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Radius, FontSize, Spacing } from '@/constants/theme';
import { OTP_LENGTH } from '@/constants/app';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  error,
  containerStyle,
}: OtpInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const digits = value.split('');

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    onChange(cleaned);
    if (cleaned.length === OTP_LENGTH) {
      onComplete?.(cleaned);
    }
  };

  const getBoxBorderColor = (index: number) => {
    if (error) return colors.destructive;
    if (digits.length === index) return colors.primary;
    if (digits.length > index) return colors.primary;
    return colors.input;
  };

  const getBoxBackground = (index: number) => {
    if (digits[index]) return colors.secondary;
    return colors.card;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={styles.boxesContainer}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              {
                borderColor: getBoxBorderColor(index),
                backgroundColor: getBoxBackground(index),
                borderRadius: Radius.md,
              },
            ]}
          >
            {digits[index] ? (
              <Text
                style={[
                  styles.digit,
                  {
                    color: colors.foreground,
                    fontSize: FontSize.lg,
                  },
                ]}
              >
                {digits[index]}
              </Text>
            ) : null}
          </View>
        ))}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="numeric"
        maxLength={OTP_LENGTH}
        style={styles.hiddenInput}
        autoComplete="one-time-code"
        autoCorrect={false}
      />

      {error && (
        <Text
          style={[
            styles.errorText,
            {
              color: colors.destructive,
              fontSize: FontSize.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  boxesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  box: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});