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
  createCommunityEvent,
} from '../../api/communitiesApi';

import { light } from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type CreateEventRoute = RouteProp<
  RootStackParamList,
  'CreateCommunityEvent'
>;

type CreateEventNavigation =
  NativeStackNavigationProp<
    RootStackParamList,
    'CreateCommunityEvent'
  >;

export default function CreateCommunityEventScreen() {
  const navigation =
    useNavigation<CreateEventNavigation>();

  const route =
    useRoute<CreateEventRoute>();

  const {
    communityId,
    communityName,
  } = route.params;

  const [title, setTitle] =
    useState('');

  const [date, setDate] =
    useState('');

  const [time, setTime] =
    useState('');

  const [location, setLocation] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      /^\d{2}:\d{2}$/.test(time) &&
      !submitting,
    [title, date, time, submitting]
  );

  async function createEvent() {
    if (!canSubmit) {
      return;
    }

    const eventDate = new Date(
      `${date}T${time}:00`
    );

    if (Number.isNaN(eventDate.getTime())) {
      Alert.alert(
        'Check the date',
        'Enter a valid date and time.'
      );
      return;
    }

    if (eventDate.getTime() <= Date.now()) {
      Alert.alert(
        'Check the date',
        'The event date must be in the future.'
      );
      return;
    }

    setSubmitting(true);

    try {
      await createCommunityEvent(
        communityId,
        {
          title: title.trim(),
          eventDate:
            eventDate.toISOString(),
          location:
            location.trim() || null,
          description:
            description.trim() || null,
        }
      );

      Alert.alert(
        'Event created',
        'Your community event is now available to members.',
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
        'Could not create event',
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
            Create Event
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
                name="calendar"
                size={24}
                color={light.primary}
              />
            </View>

            <View style={styles.introText}>
              <Text style={styles.introLabel}>
                Creating an event for
              </Text>

              <Text style={styles.communityName}>
                {communityName}
              </Text>
            </View>
          </View>

          <FieldLabel text="Event title" required />

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Community clean-up day"
            placeholderTextColor={light.textSecondary}
            maxLength={200}
          />

          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <FieldLabel text="Date" required />

              <TextInput
                style={styles.input}
                value={date}
                onChangeText={value =>
                  setDate(
                    formatDateInput(value)
                  )
                }
                placeholder="YYYY-MM-DD"
                placeholderTextColor={light.textSecondary}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.column}>
              <FieldLabel text="Time" required />

              <TextInput
                style={styles.input}
                value={time}
                onChangeText={value =>
                  setTime(
                    formatTimeInput(value)
                  )
                }
                placeholder="HH:MM"
                placeholderTextColor={light.textSecondary}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>

          <Text style={styles.inputHint}>
            Use 24-hour time, for example 14:30.
          </Text>

          <FieldLabel text="Location" />

          <View style={styles.iconInputContainer}>
            <Ionicons
              name="location-outline"
              size={20}
              color={light.textSecondary}
            />

            <TextInput
              style={styles.iconInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Venue or online meeting"
              placeholderTextColor={light.textSecondary}
              maxLength={300}
            />
          </View>

          <FieldLabel text="Description" />

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell members what the event is about..."
            placeholderTextColor={light.textSecondary}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />

          <Text style={styles.characterCount}>
            {description.length}/1000
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.createButton,
              !canSubmit &&
                styles.createButtonDisabled,
            ]}
            disabled={!canSubmit}
            onPress={() => void createEvent()}
          >
            {submitting ? (
              <ActivityIndicator
                color={light.offWhite}
              />
            ) : (
              <>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={light.offWhite}
                />

                <Text style={styles.createButtonText}>
                  Create event
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
      {text}
      {required ? ' *' : ''}
    </Text>
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

function formatTimeInput(value: string) {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
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
    marginBottom: 20,
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
    marginBottom: 8,
    marginTop: 14,
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
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  inputHint: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 7,
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
  descriptionInput: {
    minHeight: 120,
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
  createButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: light.primary,
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
