import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/api/user.api';
import { uploadImages } from '@/api/upload.api';
import { Spacing, Radius, FontSize } from '@/constants/theme';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    user?.profilePhotoUrl ?? null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const [hosted] = await uploadImages([result.assets[0].uri]);
      if (hosted) {
        setPhotoUrl(hosted);
      } else {
        Alert.alert(
          'Upload failed',
          'Could not upload your photo. Check that Cloudinary is configured (unsigned preset + correct cloud name).'
        );
      }
    } catch {
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Clear the photo locally; an empty string tells the backend to remove it
  // (it only leaves fields untouched when they're null/absent).
  const handleRemovePhoto = () => {
    setPhotoUrl('');
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    try {
      setLoading(true);
      const updatedUser = await updateProfile({
        fullName: fullName.trim(),
        email: email.trim() || null,
        profilePhotoUrl: photoUrl,
      });
      setUser(updatedUser);
      router.back();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Edit Profile"
        onBackPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Tappable avatar with camera badge */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={handlePickPhoto}
            activeOpacity={0.8}
            disabled={uploadingPhoto}
          >
            <Avatar uri={photoUrl} name={fullName || user?.fullName} size="xl" />
            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons
                  name="camera"
                  size={16}
                  color={colors.primaryForeground}
                />
              )}
            </View>
          </TouchableOpacity>

          {!!photoUrl && (
            <TouchableOpacity
              onPress={handleRemovePhoto}
              disabled={uploadingPhoto}
              style={styles.removePhotoButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
              <Text style={[styles.removePhotoText, { color: colors.destructive }]}>
                Remove photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          leftIcon="person-outline"
          error={error}
        />
        <Input
          label="Email Address (Optional)"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          hint="Used for important account notifications"
        />
        <Button
          label="Save Changes"
          onPress={handleSave}
          loading={loading}
          disabled={uploadingPhoto}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  removePhotoText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
