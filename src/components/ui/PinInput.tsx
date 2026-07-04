import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Radius, FontSize, Spacing } from '@/constants/theme';
import { PIN_LENGTH } from '@/constants/app';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export function PinInput({
  value,
  onChange,
  error,
  containerStyle,
}: PinInputProps) {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const digits = value.split('');

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    onChange(cleaned);
  };

  const getBoxBorderColor = (index: number) => {
    if (error) return colors.destructive;
    if (digits.length === index) return colors.primary;
    if (digits.length > index) return colors.primary;
    return colors.input;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={styles.boxesContainer}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              {
                borderColor: getBoxBorderColor(index),
                backgroundColor: colors.card,
                borderRadius: Radius.md,
              },
            ]}
          >
            {digits[index] ? (
              <Text
                style={[
                  styles.digit,
                  { color: colors.foreground, fontSize: FontSize.xl },
                ]}
              >
                {isVisible ? digits[index] : '●'}
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
        maxLength={PIN_LENGTH}
        secureTextEntry={!isVisible}
        style={styles.hiddenInput}
        autoComplete="off"
        autoCorrect={false}
      />

      <TouchableOpacity
        onPress={() => setIsVisible(!isVisible)}
        style={styles.visibilityToggle}
      >
        <Ionicons
          name={isVisible ? 'eye-outline' : 'eye-off-outline'}
          size={20}
          color={colors.mutedForeground}
        />
        <Text
          style={[
            styles.visibilityText,
            {
              color: colors.mutedForeground,
              fontSize: FontSize.sm,
            },
          ]}
        >
          {isVisible ? 'Hide PIN' : 'Show PIN'}
        </Text>
      </TouchableOpacity>

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
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  box: {
    width: 64,
    height: 64,
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
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  visibilityText: {
    fontWeight: '500',
  },
  errorText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});