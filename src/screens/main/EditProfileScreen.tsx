import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from
  'react-native-safe-area-context';

import { Ionicons } from
  '@expo/vector-icons';

import { useNavigation } from
  '@react-navigation/native';

import * as ImagePicker from
  'expo-image-picker';

import Avatar from
  '../../components/Avatar';

import { light } from
  '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import {
  getProfile,
  saveProfile,
} from '../../db/database';

import {
  getAccessToken,
} from '../../storage/authStorage';

import {
  updateMyProfile,
} from '../../api/profileApi';

const AVATAR_COLORS = [
  light.primary,
  light.gold,
  '#D64545',
  '#3FBF6F',
  '#1A6B4A',
  '#6B4EC6',
];

export default function EditProfileScreen() {
  const navigation = useNavigation();

  const [name, setName] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [avatarColor, setAvatarColor] =
    useState(AVATAR_COLORS[0]);

  const [
    existingPhotoUrl,
    setExistingPhotoUrl,
  ] = useState<string | null>(null);

  const [
    selectedPhotoUri,
    setSelectedPhotoUri,
  ] = useState<string | null>(null);

  const [removePhoto, setRemovePhoto] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    const profile = getProfile();

    if (!profile) {
      setErrorMessage(
        'Your profile could not be loaded.'
      );

      setIsLoading(false);
      return;
    }

    setName(profile.name ?? '');
    setUsername(profile.username ?? '');

    setAvatarColor(
      profile.avatar_color ||
        AVATAR_COLORS[0]
    );

    setExistingPhotoUrl(
      profile.photo_url ?? null
    );

    setIsLoading(false);
  }, []);

  const cleanUsername = username
    .trim()
    .toLowerCase();

  const usernameIsValid =
    /^[a-z0-9_]{3,30}$/.test(
      cleanUsername
    );

  const isValid =
    name.trim().length >= 2 &&
    name.trim().length <= 100 &&
    usernameIsValid;

  const displayedPhoto =
    selectedPhotoUri ||
    (!removePhoto
      ? existingPhotoUrl
      : null);

  const choosePhoto = async () => {
    setErrorMessage('');

    try {
      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo permission required',
          'Allow CCB to access your photos so you can choose a profile picture.'
        );

        return;
      }

      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes:
              ['images'],

            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (
        !result.canceled &&
        result.assets.length > 0
      ) {
        setSelectedPhotoUri(
          result.assets[0].uri
        );

        setRemovePhoto(false);
      }
    } catch (error) {
      console.error(
        'Photo selection error:',
        error
      );

      setErrorMessage(
        'Unable to select the photo.'
      );
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoUri(null);
    setRemovePhoto(true);
    setErrorMessage('');
  };

  const handleUsernameChange = (
    value: string
  ) => {
    const cleaned = value
      .toLowerCase()
      .replace(/\s/g, '')
      .replace(/[^a-z0-9_]/g, '');

    setUsername(cleaned);
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (
      !isValid ||
      isSaving
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');

      const accessToken =
        await getAccessToken();

      if (!accessToken) {
        setErrorMessage(
          'Your login session has expired. Please log in again.'
        );

        return;
      }

      const result =
        await updateMyProfile(
          accessToken,
          {
            name: name.trim(),

            username:
              cleanUsername,

            avatarColor,

            photoUri:
              selectedPhotoUri,

            removePhoto:
              removePhoto &&
              !selectedPhotoUri,
          }
        );

      saveProfile({
        name: result.user.name,

        username:
          result.user.username,

        phone:
          result.user.phone,

        avatar_color:
          result.user.avatarColor,

        photo_url:
          result.user
            .profilePhotoUrl ??
          null,

        balance:
          result.user.balance,

        dark_mode:
          result.user.darkMode
            ? 1
            : 0,
      });

      Alert.alert(
        'Profile updated',
        'Your changes have been saved.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update your profile.';

      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color={light.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            hitSlop={12}
            disabled={isSaving}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={light.charcoal}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Edit profile
          </Text>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.avatarSection}>
            <Pressable
              onPress={choosePhoto}
              disabled={isSaving}
              style={styles.avatarPressable}
            >
              {displayedPhoto ? (
                <Image
                  source={{
                    uri: displayedPhoto,
                  }}
                  style={styles.profilePhoto}
                  resizeMode="cover"
                />
              ) : (
                <Avatar
                  name={name || '?'}
                  color={avatarColor}
                  size={96}
                />
              )}

              <View
                style={styles.cameraButton}
              >
                <Ionicons
                  name="camera"
                  size={18}
                  color={light.offWhite}
                />
              </View>
            </Pressable>

            <Pressable
              onPress={choosePhoto}
              disabled={isSaving}
            >
              <Text style={styles.photoAction}>
                {displayedPhoto
                  ? 'Change photo'
                  : 'Add profile photo'}
              </Text>
            </Pressable>

            {displayedPhoto ? (
              <Pressable
                onPress={
                  handleRemovePhoto
                }
                disabled={isSaving}
              >
                <Text
                  style={styles.removePhoto}
                >
                  Remove photo
                </Text>
              </Pressable>
            ) : null}
          </View>

          {!displayedPhoto ? (
            <View style={styles.colorSection}>
              <Text
                style={styles.colorTitle}
              >
                Avatar colour
              </Text>

              <View style={styles.colorRow}>
                {AVATAR_COLORS.map(
                  color => (
                    <Pressable
                      key={color}
                      onPress={() =>
                        setAvatarColor(
                          color
                        )
                      }
                      disabled={isSaving}
                      style={[
                        styles.colorSwatch,

                        {
                          backgroundColor:
                            color,
                        },

                        avatarColor ===
                          color &&
                          styles
                            .colorSwatchSelected,
                      ]}
                    />
                  )
                )}
              </View>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>
              Full name
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={value => {
                setName(value);
                setErrorMessage('');
              }}
              placeholder="Enter your full name"
              placeholderTextColor={
                light.textSecondary
              }
              maxLength={100}
              editable={!isSaving}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Username
            </Text>

            <TextInput
              style={[
                styles.input,

                username.length > 0 &&
                !usernameIsValid
                  ? styles.inputError
                  : undefined,
              ]}
              value={username}
              onChangeText={
                handleUsernameChange
              }
              placeholder="Enter your username"
              placeholderTextColor={
                light.textSecondary
              }
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              editable={!isSaving}
            />

            {username.length > 0 &&
            !usernameIsValid ? (
              <Text
                style={styles.helperError}
              >
                Use at least 3 lowercase
                letters, numbers, or
                underscores.
              </Text>
            ) : null}
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={light.danger}
              />

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.saveButton,

              (!isValid || isSaving) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={
              !isValid || isSaving
            }
          >
            {isSaving ? (
              <ActivityIndicator
                size="small"
                color={light.offWhite}
              />
            ) : (
              <Text
                style={styles.saveButtonText}
              >
                Save changes
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.offWhite,
  },

  header: {
    height: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },

  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },

  headerSpace: {
    width: 26,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  avatarPressable: {
    position: 'relative',
  },

  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: light.border,
    borderWidth: 2,
    borderColor: light.primary,
  },

  cameraButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: light.offWhite,
  },

  photoAction: {
    marginTop: 12,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.primary,
  },

  removePhoto: {
    marginTop: 8,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.danger,
  },

  colorSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  colorTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginBottom: 12,
  },

  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },

  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: light.charcoal,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.charcoal,
    marginBottom: 7,
  },

  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: light.border,
    backgroundColor: light.card,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  inputError: {
    borderColor: light.danger,
  },

  helperError: {
    marginTop: 7,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.danger,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: '#FDEAEA',
  },

  errorText: {
    flex: 1,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.danger,
  },

  saveButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.primary,
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});
