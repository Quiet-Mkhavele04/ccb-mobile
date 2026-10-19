import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { completeProfile } from '../../api/profileApi';
import type { CompleteProfileResponse } from '../../api/profileApi';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import ProgressDots from '../../components/ProgressDots';
import Avatar from '../../components/Avatar';

const AVATAR_COLORS = [
  light.primary,
  light.gold,
  '#D64545',
  '#3FBF6F',
  '#1A6B4A',
  '#6B4EC6',
];

type Props = {
  phoneNumber: string;
  setupToken: string;
  onBack: () => void;
  onFinish: (
    result: CompleteProfileResponse
  ) => Promise<void> | void;
};

export default function ProfileSetupScreen({
  phoneNumber,
  setupToken,
  onBack,
  onFinish,
}: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] =
    useState('');
  const [avatarColor, setAvatarColor] =
    useState(AVATAR_COLORS[0]);
  const [photoUri, setPhotoUri] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');

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
        setPhotoUri(
          result.assets[0].uri
        );
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

  const removePhoto = () => {
    setPhotoUri(null);
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

  const handleFinish = async () => {
    if (
      !isValid ||
      isLoading ||
      !setupToken
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const result =
        await completeProfile(
          setupToken,
          {
            name: name.trim(),
            username: cleanUsername,
            avatarColor,
            photoUri,
          }
        );

      console.log(
        'Profile created:',
        result
      );

      await onFinish(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create your profile.';

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            disabled={isLoading}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={light.charcoal}
            />
          </Pressable>

          <ProgressDots
            total={5}
            current={4}
            color={light.primary}
          />

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            Set up your profile
          </Text>

          <Text style={styles.subtitle}>
            This is how other people on CCB
            will see you.
          </Text>
        </View>

        <View style={styles.avatarSection}>
          <Pressable
            onPress={choosePhoto}
            disabled={isLoading}
            style={styles.avatarPressable}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.profilePhoto}
              />
            ) : (
              <Avatar
                name={name || '?'}
                color={avatarColor}
                size={88}
              />
            )}

            <View style={styles.cameraButton}>
              <Ionicons
                name="camera"
                size={17}
                color={light.offWhite}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={choosePhoto}
            disabled={isLoading}
          >
            <Text style={styles.photoAction}>
              {photoUri
                ? 'Change photo'
                : 'Add profile photo'}
            </Text>
          </Pressable>

          {photoUri ? (
            <Pressable
              onPress={removePhoto}
              disabled={isLoading}
            >
              <Text style={styles.removePhoto}>
                Remove photo
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!photoUri ? (
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map(color => (
              <Pressable
                key={color}
                onPress={() =>
                  setAvatarColor(color)
                }
                disabled={isLoading}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor:
                      color,
                  },
                  avatarColor === color &&
                    styles
                      .colorSwatchSelected,
                ]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>
            Full name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Thabo Nkosi"
            placeholderTextColor={
              light.textSecondary
            }
            value={name}
            onChangeText={value => {
              setName(value);
              setErrorMessage('');
            }}
            maxLength={100}
            editable={!isLoading}
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
            placeholder="e.g. thabo_n"
            placeholderTextColor={
              light.textSecondary
            }
            value={username}
            onChangeText={
              handleUsernameChange
            }
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            editable={!isLoading}
          />

          {username.length > 0 &&
          !usernameIsValid ? (
            <Text style={styles.helperError}>
              Use at least 3 letters,
              numbers, or underscores.
            </Text>
          ) : null}
        </View>

        <Text style={styles.phoneNote}>
          Verified number: {phoneNumber}
        </Text>

        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.finishButton,
              (!isValid || isLoading) &&
                styles
                  .finishButtonDisabled,
            ]}
            disabled={
              !isValid || isLoading
            }
            onPress={handleFinish}
          >
            {isLoading ? (
              <ActivityIndicator
                color={light.offWhite}
              />
            ) : (
              <Text
                style={
                  styles.finishButtonText
                }
              >
                Finish & go to CCB
              </Text>
            )}
          </Pressable>
        </View>
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
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },

  headerSpace: {
    width: 24,
  },

  titleBlock: {
    marginTop: 12,
    marginBottom: 16,
  },

  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },

  subtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarPressable: {
    position: 'relative',
  },

  profilePhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: light.border,
  },

  cameraButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: light.offWhite,
  },

  photoAction: {
    marginTop: 8,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.primary,
  },

  removePhoto: {
    marginTop: 4,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.danger,
  },

  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },

  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: light.charcoal,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginBottom: 6,
  },

  input: {
    backgroundColor: light.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: light.border,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  inputError: {
    borderColor: light.danger,
  },

  helperError: {
    marginTop: 5,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.danger,
  },

  phoneNote: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 2,
  },

  errorText: {
    marginTop: 10,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.danger,
    textAlign: 'center',
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },

  finishButton: {
    backgroundColor: light.primary,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  finishButtonDisabled: {
    opacity: 0.4,
  },

  finishButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});
