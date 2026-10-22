import React, {
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  createCommunityJob,
} from '../../api/communitiesApi';

import { light } from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type JobRoute = RouteProp<
  RootStackParamList,
  'CreateCommunityJob'
>;

type JobNavigation =
  NativeStackNavigationProp<
    RootStackParamList,
    'CreateCommunityJob'
  >;

const EMPLOYMENT_TYPES = [
  'Internship',
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Volunteer',
] as const;

export default function CreateCommunityJobScreen() {
  const navigation =
    useNavigation<JobNavigation>();

  const route = useRoute<JobRoute>();

  const {
    communityId,
    communityName,
  } = route.params;

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] =
    useState('');
  const [applicationContact, setApplicationContact] =
    useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] =
    useState(false);

  const expiryValid =
    expiresOn.length === 0 ||
    /^\d{4}-\d{2}-\d{2}$/.test(
      expiresOn
    );

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      detail.trim().length > 0 &&
      expiryValid &&
      !submitting,
    [
      title,
      detail,
      expiryValid,
      submitting,
    ]
  );

  async function postOpportunity() {
    if (!canSubmit) {
      return;
    }

    let expiresAt: string | null = null;

    if (expiresOn) {
      const expiryDate = new Date(
        `${expiresOn}T23:59:00`
      );

      if (
        Number.isNaN(expiryDate.getTime()) ||
        expiryDate.getTime() <= Date.now()
      ) {
        Alert.alert(
          'Check the closing date',
          'Enter a valid future closing date.'
        );
        return;
      }

      expiresAt = expiryDate.toISOString();
    }

    setSubmitting(true);

    try {
      await createCommunityJob(
        communityId,
        {
          title: title.trim(),
          detail: detail.trim(),
          company: company.trim() || null,
          location:
            location.trim() || null,
          employmentType:
            employmentType || null,
          applicationContact:
            applicationContact.trim() || null,
          expiresAt,
        }
      );

      Alert.alert(
        'Opportunity posted',
        'Community members can now view this opportunity.',
        [
          {
            text: 'Done',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Could not post opportunity',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() =>
              navigation.goBack()
            }
            hitSlop={12}
          >
            <Ionicons
              name="close"
              size={26}
              color={light.charcoal}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Post Opportunity
          </Text>

          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons
                name="briefcase"
                size={23}
                color={light.primary}
              />
            </View>

            <View style={styles.introText}>
              <Text style={styles.introLabel}>
                Posting to
              </Text>

              <Text style={styles.communityName}>
                {communityName}
              </Text>
            </View>
          </View>

          <FieldLabel text="Opportunity title" required />

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Junior developer internship"
            placeholderTextColor={light.textSecondary}
            maxLength={200}
          />

          <FieldLabel text="Company or organisation" />

          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Organisation name"
            placeholderTextColor={light.textSecondary}
            maxLength={150}
          />

          <FieldLabel text="Employment type" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}
          >
            {EMPLOYMENT_TYPES.map(type => {
              const selected =
                employmentType === type;

              return (
                <Pressable
                  key={type}
                  style={[
                    styles.typeChip,
                    selected &&
                      styles.typeChipSelected,
                  ]}
                  onPress={() =>
                    setEmploymentType(
                      selected ? '' : type
                    )
                  }
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      selected &&
                        styles.typeChipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <FieldLabel text="Location" />

          <IconInput
            icon="location-outline"
            value={location}
            onChangeText={setLocation}
            placeholder="City, suburb or remote"
            maxLength={200}
          />

          <FieldLabel text="Application contact" />

          <IconInput
            icon="mail-outline"
            value={applicationContact}
            onChangeText={setApplicationContact}
            placeholder="Email, phone number or website"
            maxLength={300}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FieldLabel text="Closing date" />

          <TextInput
            style={styles.input}
            value={expiresOn}
            onChangeText={value =>
              setExpiresOn(
                formatDateInput(value)
              )
            }
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor={light.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
          />

          <FieldLabel text="Opportunity details" required />

          <TextInput
            style={[
              styles.input,
              styles.detailInput,
            ]}
            value={detail}
            onChangeText={setDetail}
            placeholder="Describe the role, requirements and how to apply..."
            placeholderTextColor={light.textSecondary}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />

          <Text style={styles.characterCount}>
            {detail.length}/2000
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.postButton,
              !canSubmit &&
                styles.postButtonDisabled,
            ]}
            disabled={!canSubmit}
            onPress={() =>
              void postOpportunity()
            }
          >
            {submitting ? (
              <ActivityIndicator
                color={light.offWhite}
              />
            ) : (
              <>
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={light.offWhite}
                />

                <Text style={styles.postButtonText}>
                  Post opportunity
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({
  text,
  required = false,
}: {
  text: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {text}{required ? ' *' : ''}
    </Text>
  );
}

function IconInput({
  icon,
  value,
  onChangeText,
  placeholder,
  maxLength,
  keyboardType,
  autoCapitalize,
}: {
  icon: 'location-outline' | 'mail-outline';
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength: number;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.iconInputContainer}>
      <Ionicons
        name={icon}
        size={20}
        color={light.textSecondary}
      />

      <TextInput
        style={styles.iconInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={light.textSecondary}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function formatDateInput(value: string) {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8);

  if (digits.length <= 4) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
    backgroundColor: light.card,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EAF3EF',
    marginBottom: 18,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.card,
  },
  introText: {
    flex: 1,
    marginLeft: 12,
  },
  introLabel: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  communityName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.primary,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    backgroundColor: light.card,
    paddingHorizontal: 14,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  typeRow: {
    gap: 8,
    paddingRight: 20,
  },
  typeChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 999,
    backgroundColor: light.card,
  },
  typeChipSelected: {
    borderColor: light.primary,
    backgroundColor: light.primary,
  },
  typeChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  typeChipTextSelected: {
    color: light.offWhite,
  },
  iconInputContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    backgroundColor: light.card,
    paddingHorizontal: 14,
  },
  iconInput: {
    flex: 1,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  detailInput: {
    minHeight: 140,
    paddingTop: 14,
    paddingBottom: 14,
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: light.border,
    backgroundColor: light.card,
  },
  postButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: light.primary,
  },
  postButtonDisabled: {
    opacity: 0.45,
  },
  postButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});
