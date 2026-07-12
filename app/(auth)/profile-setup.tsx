import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuthStore } from '@/store/authStore';
import { Spacing, FontSize, Radius } from '@/constants/theme';
import {
  REGIONS,
  getCitiesByRegion,
  type Region,
} from '@/constants/regions';

interface FormState {
  fullName: string;
  email: string;
  region: Region | '';
  cityTown: string;
}

interface FormErrors {
  fullName?: string;
  region?: string;
  cityTown?: string;
}

export default function ProfileSetupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    region: '',
    cityTown: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleRegionSelect = (region: Region) => {
    setForm((prev) => ({ ...prev, region, cityTown: '' }));
    setCitySuggestions(getCitiesByRegion(region));
    setShowRegionPicker(false);
  };

  const handleCitySelect = (city: string) => {
    updateForm('cityTown', city);
    setShowCityPicker(false);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!form.region) {
      newErrors.region = 'Please select your region';
    }
    if (!form.cityTown.trim()) {
      newErrors.cityTown = 'City or town is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (user) {
        setUser({
          ...user,
          fullName: form.fullName,
          email: form.email || null,
          region: form.region,
          cityTown: form.cityTown,
        });
      }
      router.replace('/(auth)/role-selection');
    } catch (err) {
      setErrors({ fullName: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.topSection, { backgroundColor: colors.background }]}>
        <ScreenHeader
          showBack
          transparent
          containerStyle={styles.header}
        />
        <Text style={[styles.topTitle, { color: colors.gold }]}>
          Set up your profile
        </Text>
        <Text
          style={[styles.topSubtitle, { color: colors.mutedForeground }]}
        >
          Tell us a little about yourself
        </Text>
      </View>

      <View
        style={[
          styles.bottomSection,
          { backgroundColor: colors.background },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Your details
          </Text>
          <Text
            style={[styles.subheading, { color: colors.mutedForeground }]}
          >
            You can update these later in your profile
          </Text>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={form.fullName}
            onChangeText={(text) => updateForm('fullName', text)}
            error={errors.fullName}
            autoCapitalize="words"
            leftIcon="person-outline"
          />

          <Input
            label="Email Address (Optional)"
            placeholder="Enter your email address"
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            hint="Used for important account notifications"
          />

          {/* Region Picker */}
          <View style={styles.fieldContainer}>
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: errors.region
                    ? colors.destructive
                    : colors.foreground,
                },
              ]}
            >
              Region
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  borderColor: errors.region
                    ? colors.destructive
                    : colors.input,
                  backgroundColor: colors.card,
                  borderRadius: Radius.md,
                },
              ]}
              onPress={() => setShowRegionPicker(true)}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.pickerText,
                  {
                    color: form.region
                      ? colors.foreground
                      : colors.mutedForeground,
                  },
                ]}
              >
                {form.region || 'Select your region'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {errors.region && (
              <Text
                style={[
                  styles.errorText,
                  { color: colors.destructive },
                ]}
              >
                {errors.region}
              </Text>
            )}
          </View>

          {/* City/Town Input with suggestions */}
          <View style={styles.fieldContainer}>
            <Input
              label="City / Town"
              placeholder="Enter your city or town"
              value={form.cityTown}
              onChangeText={(text) => updateForm('cityTown', text)}
              error={errors.cityTown}
              leftIcon="business-outline"
              hint="Type your town name if not in suggestions"
            />
            {citySuggestions.length > 0 && !form.cityTown && (
              <View
                style={[
                  styles.suggestionsContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: Radius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.suggestionsLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Suggestions for {form.region}:
                </Text>
                <View style={styles.suggestionChips}>
                  {citySuggestions.map((city) => (
                    <TouchableOpacity
                      key={city}
                      onPress={() => handleCitySelect(city)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: colors.secondary,
                          borderRadius: Radius.full,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.primary },
                        ]}
                      >
                        {city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Button
            label="Complete Setup"
            onPress={handleSave}
            loading={loading}
            style={styles.button}
          />
        </ScrollView>
      </View>

      {/* Region Picker Modal */}
      <Modal
        visible={showRegionPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRegionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: colors.foreground }]}
              >
                Select Region
              </Text>
              <TouchableOpacity
                onPress={() => setShowRegionPicker(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REGIONS}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor:
                        form.region === item.name
                          ? colors.secondary
                          : 'transparent',
                    },
                  ]}
                  onPress={() => handleRegionSelect(item.name)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      {
                        color:
                          form.region === item.name
                            ? colors.primary
                            : colors.foreground,
                        fontWeight:
                          form.region === item.name ? '600' : '400',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {form.region === item.name && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topSection: {
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  header: {
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  topTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  topSubtitle: {
    fontSize: FontSize.sm,
    opacity: 0.85,
  },
  bottomSection: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
  },
  scrollContent: {
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
  },
  fieldContainer: {
    marginBottom: Spacing.base,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    gap: Spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: FontSize.base,
  },
  errorText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  suggestionsContainer: {
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  suggestionsLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  button: {
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: FontSize.base,
  },
});