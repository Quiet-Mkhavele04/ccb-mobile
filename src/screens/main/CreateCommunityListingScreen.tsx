import React, {
  useMemo,
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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';

import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  createCommunityListing,
  uploadCommunityListingImage,
} from '../../api/communitiesApi';

import { light } from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type ListingRoute = RouteProp<
  RootStackParamList,
  'CreateCommunityListing'
>;

type ListingNavigation =
  NativeStackNavigationProp<
    RootStackParamList,
    'CreateCommunityListing'
  >;

const CONDITIONS = [
  'New',
  'Like New',
  'Used - Good',
  'Used - Fair',
] as const;

type SelectedImage = {
  uri: string;
  fileName: string | null;
  mimeType: string | null;
};

export default function CreateCommunityListingScreen() {
  const navigation =
    useNavigation<ListingNavigation>();

  const route = useRoute<ListingRoute>();

  const {
    communityId,
    communityName,
  } = route.params;

  const [image, setImage] =
    useState<SelectedImage | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] =
    useState(false);

  const parsedPrice =
    price.trim().length > 0
      ? Number(price.replace(',', '.'))
      : null;

  const priceValid =
    parsedPrice === null ||
    (
      Number.isFinite(parsedPrice) &&
      parsedPrice >= 0
    );

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      contact.trim().length > 0 &&
      priceValid &&
      !submitting,
    [
      title,
      contact,
      priceValid,
      submitting,
    ]
  );

  async function chooseImage() {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo permission required',
        'Allow CCB to access your photos so you can add a listing image.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

    if (!result.canceled) {
      const asset = result.assets[0];

     setImage({
  uri: asset.uri,
  fileName:
    asset.fileName ?? null,
  mimeType:
    asset.mimeType ?? null,
});
    }
  }

  async function publishListing() {
    if (!canSubmit) {
      return;
    }

    if (!priceValid) {
      Alert.alert(
        'Check the price',
        'Enter a valid price or leave it empty.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await createCommunityListing(
          communityId,
          {
            title: title.trim(),
            price: parsedPrice,
            description:
              description.trim() || null,
            category:
              category.trim() || null,
            condition:
              condition || null,
            location:
              location.trim() || null,
            contact: contact.trim(),
          }
        );

      if (image) {
        await uploadCommunityListingImage(
          communityId,
          response.communityListing
            .communityListingId,
          image
        );
      }

      Alert.alert(
        'Listing published',
        'Community members can now view your marketplace listing.',
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
        'Could not publish listing',
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
            New Listing
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
                name="storefront"
                size={23}
                color={light.primary}
              />
            </View>

            <View style={styles.introText}>
              <Text style={styles.introLabel}>
                Selling in
              </Text>

              <Text style={styles.communityName}>
                {communityName}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.imagePicker}
            onPress={() =>
              void chooseImage()
            }
          >
            {image ? (
              <>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.selectedImage}
                />

                <View style={styles.changeImageBadge}>
                  <Ionicons
                    name="camera"
                    size={18}
                    color={light.offWhite}
                  />

                  <Text style={styles.changeImageText}>
                    Change photo
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={34}
                  color={light.primary}
                />

                <Text style={styles.imageTitle}>
                  Add a product photo
                </Text>

                <Text style={styles.imageHint}>
                  JPG, PNG or WEBP · Maximum 5 MB
                </Text>
              </View>
            )}
          </Pressable>

          <FieldLabel text="Listing title" required />

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Second-hand study desk"
            placeholderTextColor={light.textSecondary}
            maxLength={200}
          />

          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <FieldLabel text="Price (R)" />

              <TextInput
                style={styles.input}
                value={price}
                onChangeText={value =>
                  setPrice(
                    value.replace(
                      /[^0-9.,]/g,
                      ''
                    )
                  )
                }
                placeholder="750.00"
                placeholderTextColor={light.textSecondary}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>

            <View style={styles.column}>
              <FieldLabel text="Category" />

              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Furniture"
                placeholderTextColor={light.textSecondary}
                maxLength={100}
              />
            </View>
          </View>

          <FieldLabel text="Condition" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.conditionRow}
          >
            {CONDITIONS.map(item => {
              const selected =
                condition === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.conditionChip,
                    selected &&
                      styles.conditionChipSelected,
                  ]}
                  onPress={() =>
                    setCondition(
                      selected ? '' : item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.conditionChipText,
                      selected &&
                        styles.conditionChipTextSelected,
                    ]}
                  >
                    {item}
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
            placeholder="Suburb, town or collection point"
            maxLength={200}
          />

          <FieldLabel text="Contact information" required />

          <IconInput
            icon="call-outline"
            value={contact}
            onChangeText={setContact}
            placeholder="Phone number, email or preferred contact"
            maxLength={300}
          />

          <FieldLabel text="Description" />

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item, its condition and collection details..."
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
              styles.publishButton,
              !canSubmit &&
                styles.publishButtonDisabled,
            ]}
            disabled={!canSubmit}
            onPress={() =>
              void publishListing()
            }
          >
            {submitting ? (
              <ActivityIndicator
                color={light.offWhite}
              />
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={21}
                  color={light.offWhite}
                />

                <Text style={styles.publishButtonText}>
                  Publish listing
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
}: {
  icon:
    | 'location-outline'
    | 'call-outline';
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  maxLength: number;
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
      />
    </View>
  );
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
    paddingBottom: 32,
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
  imagePicker: {
    height: 210,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: light.primary,
    borderRadius: 16,
    backgroundColor: '#EAF3EF',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    marginTop: 10,
  },
  imageHint: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 4,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  changeImageBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  changeImageText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.offWhite,
  },
  fieldLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    marginTop: 16,
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
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  conditionRow: {
    gap: 8,
    paddingRight: 20,
  },
  conditionChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 999,
    backgroundColor: light.card,
  },
  conditionChipSelected: {
    borderColor: light.primary,
    backgroundColor: light.primary,
  },
  conditionChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  conditionChipTextSelected: {
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
  descriptionInput: {
    minHeight: 130,
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
  publishButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: light.primary,
  },
  publishButtonDisabled: {
    opacity: 0.45,
  },
  publishButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
});
