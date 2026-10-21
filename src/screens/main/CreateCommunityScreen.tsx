import React, { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  createCommunity,
} from '../../api/communitiesApi';

import { light } from '../../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type CreateCommunityNavProp =
  NativeStackNavigationProp<
    RootStackParamList,
    'CreateCommunity'
  >;

const CATEGORIES = [
  'Business',
  'Finance',
  'Lifestyle',
  'Education',
  'Sports',
  'Arts',
];

const BANNER_COLORS = [
  '#1A6B4A',
  '#3FBF6F',
  '#F5A623',
  '#6B4EC6',
  '#D64545',
  '#2474B5',
];

export default function CreateCommunityScreen() {
  const navigation =
    useNavigation<CreateCommunityNavProp>();

  const [name, setName] =
    useState('');

  const [category, setCategory] =
    useState('Education');

  const [description, setDescription] =
    useState('');

  const [bannerColor, setBannerColor] =
    useState(BANNER_COLORS[0]);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const valid =
    name.trim().length >= 3 &&
    category.length > 0 &&
    description.trim().length >= 10;

  async function handleCreate() {
    if (!valid || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createCommunity({
        name: name.trim(),
        category,
        description:
          description.trim() || null,
        bannerColor,
      });

      navigation.goBack();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Could not create the community.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          disabled={busy}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={light.charcoal}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Create Community
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.preview,
              {
                backgroundColor: bannerColor,
              },
            ]}
          >
            <View style={styles.previewIcon}>
              <Ionicons
                name="people"
                size={34}
                color={light.offWhite}
              />
            </View>

            <Text
              style={styles.previewName}
              numberOfLines={1}
            >
              {name.trim() || 'Your community'}
            </Text>

            <Text style={styles.previewCategory}>
              {category}
            </Text>
          </View>

          <Text style={styles.label}>
            Community name
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gqeberha Student Network"
            placeholderTextColor={light.textSecondary}
            maxLength={150}
            autoCapitalize="words"
          />

          <Text style={styles.helperText}>
            Choose a clear name people can recognise.
          </Text>

          <Text style={styles.label}>
            Category
          </Text>

          <View style={styles.optionsWrap}>
            {CATEGORIES.map(item => {
              const selected =
                item === category;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.categoryChip,
                    selected &&
                      styles.categoryChipSelected,
                  ]}
                  onPress={() =>
                    setCategory(item)
                  }
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>
            Description
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people what this community is about..."
            placeholderTextColor={light.textSecondary}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />

          <Text style={styles.characterCount}>
            {description.length}/2000
          </Text>

          <Text style={styles.label}>
            Banner colour
          </Text>

          <View style={styles.colorRow}>
            {BANNER_COLORS.map(color => {
              const selected =
                color === bannerColor;

              return (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                    },
                    selected &&
                      styles.colorOptionSelected,
                  ]}
                  onPress={() =>
                    setBannerColor(color)
                  }
                  accessibilityLabel={`Select ${color}`}
                >
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={light.offWhite}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.adminNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={light.primary}
            />

            <Text style={styles.adminNoticeText}>
              You will become the first administrator and member of this community.
            </Text>
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={light.danger}
              />

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

          <Pressable
            style={[
              styles.createButton,
              (!valid || busy) &&
                styles.createButtonDisabled,
            ]}
            disabled={!valid || busy}
            onPress={() => {
              void handleCreate();
            }}
          >
            {busy ? (
              <ActivityIndicator
                color={light.offWhite}
              />
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={light.offWhite}
                />

                <Text style={styles.createButtonText}>
                  Create community
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  keyboardArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },
  headerSpacer: {
    width: 26,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  preview: {
    minHeight: 150,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 24,
  },
  previewIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.offWhite,
    marginTop: 12,
  },
  previewCategory: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 3,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  descriptionInput: {
    minHeight: 120,
  },
  helperText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 6,
  },
  characterCount: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    textAlign: 'right',
    marginTop: 5,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryChipSelected: {
    backgroundColor: light.primary,
    borderColor: light.primary,
  },
  categoryText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },
  categoryTextSelected: {
    color: light.offWhite,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: light.charcoal,
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EAF3EF',
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
  },
  adminNoticeText: {
    flex: 1,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.primary,
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEAEA',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.danger,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: light.primary,
    marginTop: 22,
  },
  createButtonDisabled: {
    opacity: 0.45,
  },
  createButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});
