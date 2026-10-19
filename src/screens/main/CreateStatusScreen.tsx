import React, {
  useCallback,
  useState,
} from 'react';

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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import * as ImagePicker
  from 'expo-image-picker';

import {
  VideoView,
  useVideoPlayer,
} from 'expo-video';

import {
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  createStatus,
} from '../../api/statusesApi';

import type {
  StatusMediaInput,
} from '../../api/statusesApi';

import { light } from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type CreateStatusNavProp =
  NativeStackNavigationProp<
    RootStackParamList,
    'CreateStatus'
  >;

const STATUS_COLORS = [
  '#0D5740',
  '#176B87',
  '#7A3E9D',
  '#B3541E',
  '#9E2A2B',
  '#3A506B',
];

const MAX_STATUS_LENGTH = 500;

function VideoPreview({
  uri,
}: {
  uri: string;
}) {
  const player =
    useVideoPlayer(
      uri,
      videoPlayer => {
        videoPlayer.loop = true;
        videoPlayer.muted = true;
      }
    );

  return (
    <VideoView
      player={player}
      style={styles.mediaPreview}
      contentFit="contain"
      nativeControls
    />
  );
}

export default function CreateStatusScreen() {
  const navigation =
    useNavigation<CreateStatusNavProp>();

  const [caption, setCaption] =
    useState('');

  const [
    backgroundColor,
    setBackgroundColor,
  ] = useState(STATUS_COLORS[0]);

  const [media, setMedia] =
    useState<StatusMediaInput | null>(
      null
    );

  const [mediaKind, setMediaKind] =
    useState<
      'image' | 'video' | null
    >(null);

  const [publishing, setPublishing] =
    useState(false);

  const trimmedCaption =
    caption.trim();

  const canPublish =
    Boolean(
      trimmedCaption ||
      media
    ) &&
    !publishing;

  const chooseMedia =
    useCallback(async () => {
      try {
        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Permission required',
            'Allow CCB to access your photos and videos.'
          );

          return;
        }

        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes: [
                'images',
                'videos',
              ],
              allowsEditing: false,
              quality: 0.85,
              videoMaxDuration: 60,
            });

        if (
          result.canceled ||
          !result.assets[0]
        ) {
          return;
        }

        const asset =
          result.assets[0];

        const kind =
          asset.type === 'video'
            ? 'video'
            : 'image';

        const extension =
          kind === 'video'
            ? 'mp4'
            : 'jpg';

        const mimeType =
          asset.mimeType ||
          (
            kind === 'video'
              ? 'video/mp4'
              : 'image/jpeg'
          );

        setMedia({
          uri: asset.uri,

          fileName:
            asset.fileName ||
            `status-${Date.now()}.${extension}`,

          mimeType,
        });

        setMediaKind(kind);

        console.log(
          'Status media selected:',
          {
            uri: asset.uri,
            fileName:
              asset.fileName,
            mimeType,
            kind,
            fileSize:
              asset.fileSize,
          }
        );
      } catch (pickerError) {
        console.error(
          'Unable to choose status media:',
          pickerError
        );

        Alert.alert(
          'Media not selected',
          'Unable to open the selected photo or video.'
        );
      }
    }, []);

  const handlePublish =
    useCallback(async () => {
      if (!canPublish) {
        return;
      }

      try {
        setPublishing(true);

        console.log(
          'Publishing status:',
          {
            caption:
              trimmedCaption,
            backgroundColor,
            media,
          }
        );

        const result =
          await createStatus(
            trimmedCaption,
            backgroundColor,
            media
          );

        console.log(
          'Status created:',
          result.status
        );

        navigation.goBack();
      } catch (requestError) {
        console.error(
          'Unable to publish status:',
          requestError
        );

        Alert.alert(
          'Status not published',
          requestError instanceof Error
            ? requestError.message
            : 'Unable to publish your status.'
        );
      } finally {
        setPublishing(false);
      }
    }, [
      backgroundColor,
      canPublish,
      media,
      navigation,
      trimmedCaption,
    ]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom']}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            hitSlop={12}
          >
            <Ionicons
              name="close"
              size={28}
              color={light.charcoal}
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Create status
          </Text>

          <Pressable
            style={[
              styles.publishButton,
              !canPublish &&
                styles.publishButtonDisabled,
            ]}
            onPress={() =>
              void handlePublish()
            }
            disabled={!canPublish}
          >
            {publishing ? (
              <ActivityIndicator
                size="small"
                color={light.offWhite}
              />
            ) : (
              <Text
                style={
                  styles.publishText
                }
              >
                Publish
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={[
            styles.preview,
            {
              backgroundColor,
            },
          ]}
        >
          {mediaKind === 'image' &&
          media ? (
            <Image
              source={{
                uri: media.uri,
              }}
              style={
                styles.mediaPreview
              }
              resizeMode="contain"
            />
          ) : mediaKind === 'video' &&
            media ? (
            <VideoPreview
              uri={media.uri}
            />
          ) : null}

          <TextInput
            style={[
              styles.statusInput,
              media &&
                styles.statusInputWithMedia,
            ]}
            value={caption}
            onChangeText={value =>
              setCaption(
                value.slice(
                  0,
                  MAX_STATUS_LENGTH
                )
              )
            }
            placeholder={
              media
                ? 'Add a caption...'
                : 'Type a status...'
            }
            placeholderTextColor=
              "rgba(255,255,255,0.7)"
            multiline
            textAlign="center"
            maxLength={
              MAX_STATUS_LENGTH
            }
          />

          {media && (
            <Pressable
              style={
                styles.removeMediaButton
              }
              onPress={() => {
                setMedia(null);
                setMediaKind(null);
              }}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color={light.offWhite}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={styles.mediaButton}
            onPress={() =>
              void chooseMedia()
            }
          >
            <Ionicons
              name="images-outline"
              size={22}
              color={light.primary}
            />

            <Text
              style={
                styles.mediaButtonText
              }
            >
              Photo or video
            </Text>
          </Pressable>

          <Text
            style={
              styles.characterCount
            }
          >
            {caption.length}/
            {MAX_STATUS_LENGTH}
          </Text>
        </View>

        <Text style={styles.colorTitle}>
          Background colour
        </Text>

        <View style={styles.colorRow}>
          {STATUS_COLORS.map(color => (
            <Pressable
              key={color}
              style={[
                styles.colorButton,
                {
                  backgroundColor:
                    color,
                },
                color ===
                  backgroundColor &&
                  styles
                    .colorButtonSelected,
              ]}
              onPress={() =>
                setBackgroundColor(
                  color
                )
              }
            >
              {color ===
                backgroundColor && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={
                    light.offWhite
                  }
                />
              )}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor:
      light.offWhite,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  headerTitle: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  publishButton: {
    backgroundColor:
      light.primary,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
  },

  publishButtonDisabled: {
    opacity: 0.4,
  },

  publishText: {
    color: light.offWhite,
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.sm,
  },

  preview: {
    flex: 1,
    margin: 18,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mediaPreview: {
    ...StyleSheet.absoluteFill,
  },

  statusInput: {
    width: '88%',
    color: light.offWhite,
    fontFamily:
      fontFamily.semibold,
    fontSize: 24,
    textAlign: 'center',
    padding: 18,
  },

  statusInputWithMedia: {
    position: 'absolute',
    bottom: 18,
    fontSize: fontSize.md,
    backgroundColor:
      'rgba(0,0,0,0.42)',
    borderRadius: 16,
  },

  removeMediaButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginHorizontal: 20,
    marginBottom: 18,
  },

  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 14,
    backgroundColor:
      light.card,
    borderWidth: 1,
    borderColor: light.border,
  },

  mediaButtonText: {
    color: light.primary,
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.sm,
  },

  characterCount: {
    color:
      light.textSecondary,
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.xs,
  },

  colorTitle: {
    marginHorizontal: 20,
    marginBottom: 10,
    color: light.charcoal,
    fontFamily:
      fontFamily.semibold,
  },

  colorRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  colorButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  colorButtonSelected: {
    borderWidth: 3,
    borderColor: light.gold,
  },
});