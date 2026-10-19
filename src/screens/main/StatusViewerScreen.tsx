import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import {
  deleteStatus,
  markStatusViewed,
  resolveStatusMediaUrl,
} from '../../api/statusesApi';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import type { RootStackParamList, StatusViewerItem } from '../../navigation/RootNavigator';

type ViewerRouteProp = RouteProp<RootStackParamList, 'StatusViewer'>;
type ViewerNavProp = NativeStackNavigationProp<RootStackParamList, 'StatusViewer'>;

const TEXT_DURATION_MS = 7000;
const VIDEO_FALLBACK_DURATION_MS = 15000;

function StatusVideo({
  uri,
  onDuration,
}: {
  uri: string;
  onDuration: (durationMs: number) => void;
}) {
  const player = useVideoPlayer(uri, videoPlayer => {
    videoPlayer.loop = false;
    videoPlayer.play();
  });

  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEffect(() => {
    if (status === 'readyToPlay' && player.duration > 0) {
      onDuration(player.duration * 1000);
    }
  }, [onDuration, player, status]);

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

function formatStatusTime(value: string) {
  const normalized = value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value)
    ? value
    : `${value}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StatusViewerScreen() {
  const navigation = useNavigation<ViewerNavProp>();
  const route = useRoute<ViewerRouteProp>();

  const [items, setItems] = useState<StatusViewerItem[]>(route.params.statuses);
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(route.params.initialIndex, Math.max(route.params.statuses.length - 1, 0))
  );
  const [duration, setDuration] = useState(TEXT_DURATION_MS);
  const [deleting, setDeleting] = useState(false);
  const [playbackKey, setPlaybackKey] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const current = items[currentIndex];

  const close = useCallback(() => navigation.goBack(), [navigation]);

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(index => index + 1);
    } else {
      close();
    }
  }, [close, currentIndex, items.length]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(index => index - 1);
    } else {
      progress.setValue(0);
      setPlaybackKey(value => value + 1);
    }
  }, [currentIndex, progress]);

  useEffect(() => {
    if (!current) {
      close();
      return;
    }

    setDuration(
      current.mediaType === 'video'
        ? VIDEO_FALLBACK_DURATION_MS
        : TEXT_DURATION_MS
    );

    void markStatusViewed(current.statusId).catch(error => {
      console.error('Unable to mark status viewed:', error);
    });

    setItems(previous =>
      previous.map((item, index) =>
        index === currentIndex ? { ...item, viewed: true } : item
      )
    );
  }, [close, current?.statusId, currentIndex]);

  useEffect(() => {
    if (!current) return;

    progress.setValue(0);
    animationRef.current?.stop();

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) goNext();
    });

    return () => animation.stop();
  }, [current?.statusId, duration, goNext, playbackKey, progress]);

  const handleDelete = useCallback(() => {
    if (!current) return;

    animationRef.current?.stop();

    Alert.alert('Delete status', 'Delete this status?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => setPlaybackKey(value => value + 1),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setDeleting(true);
              await deleteStatus(current.statusId);
              const remaining = items.filter(item => item.statusId !== current.statusId);

              if (remaining.length === 0) {
                close();
                return;
              }

              setItems(remaining);
              setCurrentIndex(index => Math.min(index, remaining.length - 1));
              setDeleting(false);
              setPlaybackKey(value => value + 1);
            } catch (error) {
              setDeleting(false);
              Alert.alert(
                'Status not deleted',
                error instanceof Error ? error.message : 'Unable to delete the status.'
              );
              setPlaybackKey(value => value + 1);
            }
          })();
        },
      },
    ]);
  }, [close, current, items]);

  if (!current) return null;

  const mediaUrl = resolveStatusMediaUrl(current.mediaUrl);
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: current.bgColor || '#111' }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressRow}>
          {items.map((item, index) => (
            <View key={item.statusId} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: index < currentIndex ? '100%' : '0%' },
                ]}
              />
              {index === currentIndex && (
                <Animated.View style={[styles.progressFill, { width }]} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <Avatar
            name={current.name}
            color={current.avatarColor}
            photoUrl={current.photoUrl}
            size={38}
          />

          <View style={styles.headerText}>
            <Text style={styles.name}>
              {current.isMine ? 'My status' : current.name}
            </Text>
            <Text style={styles.timestamp}>{formatStatusTime(current.timestamp)}</Text>
          </View>

          {current.isMine && (
            <Pressable
              onPress={handleDelete}
              hitSlop={12}
              disabled={deleting}
              style={styles.headerAction}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={light.offWhite} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={light.offWhite} />
              )}
            </Pressable>
          )}

          <Pressable onPress={close} hitSlop={12}>
            <Ionicons name="close" size={27} color={light.offWhite} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {current.mediaType === 'image' && mediaUrl ? (
            <Image source={{ uri: mediaUrl }} style={styles.media} resizeMode="contain" />
          ) : current.mediaType === 'video' && mediaUrl ? (
            <StatusVideo
              key={`${current.statusId}-${playbackKey}`}
              uri={mediaUrl}
              onDuration={setDuration}
            />
          ) : (
            <Text style={styles.textStatus}>{current.caption}</Text>
          )}

          {current.mediaType && current.caption ? (
            <View style={styles.captionOverlay}>
              <Text style={styles.mediaCaption}>{current.caption}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tapRow} pointerEvents="box-none">
          <Pressable style={styles.tapArea} onPress={goPrevious} />
          <Pressable style={styles.tapArea} onPress={goNext} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: light.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 13,
    zIndex: 5,
  },
  headerText: { marginLeft: 10, flex: 1 },
  headerAction: { marginRight: 18 },
  name: {
    color: light.offWhite,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: { width: '100%', height: '100%' },
  textStatus: {
    color: light.offWhite,
    fontFamily: fontFamily.semibold,
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 28,
    maxWidth: '90%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mediaCaption: {
    color: light.offWhite,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  tapRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    paddingTop: 90,
  },
  tapArea: { flex: 1 },
});
