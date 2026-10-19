import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import Svg, { Circle } from 'react-native-svg';
import Avatar from './Avatar';
import { resolveStatusMediaUrl } from '../api/statusesApi';
import { light } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/fonts';
import type { Profile, StatusItem } from '../db/database';

export type StatusRowItem = StatusItem & {
  is_mine?: boolean;
  photo_url?: string | null;
  media_type?: 'image' | 'video' | null;
  media_url?: string | null;
};

type StatusGroup = {
  key: string;
  name: string;
  isMine: boolean;
  statuses: StatusRowItem[];
};

type Props = {
  statuses: StatusRowItem[];
  myProfile: Profile | null;
  onAddStatus: () => void;
  onOpenStatuses: (
    statuses: StatusRowItem[],
    initialIndex: number
  ) => void;
};

const RING_SIZE = 70;
const PREVIEW_SIZE = 58;
const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function SegmentedRing({ statuses }: { statuses: StatusRowItem[] }) {
  const count = Math.max(statuses.length, 1);
  const gap = count === 1 ? 0 : 5;
  const segmentLength = (CIRCUMFERENCE - gap * count) / count;

  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
      {statuses.map((status, index) => (
        <Circle
          key={status.status_id}
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={status.viewed ? light.border : light.gold}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${segmentLength} ${CIRCUMFERENCE - segmentLength}`}
          strokeDashoffset={-(index * (segmentLength + gap))}
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      ))}
    </Svg>
  );
}

function VideoStatusPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, videoPlayer => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.previewMedia}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function StatusPreview({ status }: { status: StatusRowItem }) {
  const mediaUrl = resolveStatusMediaUrl(status.media_url);

  if (status.media_type === 'image' && mediaUrl) {
    return <Image source={{ uri: mediaUrl }} style={styles.previewMedia} resizeMode="cover" />;
  }

  if (status.media_type === 'video' && mediaUrl) {
    return (
      <View style={styles.previewVideoContainer}>
        <VideoStatusPreview uri={mediaUrl} />
        <Ionicons name="play" size={18} color={light.offWhite} style={styles.playIcon} />
      </View>
    );
  }

  return (
    <View style={[styles.textPreview, { backgroundColor: status.bg_color || light.primary }]}>
      <Text style={styles.textPreviewLabel} numberOfLines={2}>
        {status.caption || 'Status'}
      </Text>
    </View>
  );
}

export default function StatusRow({
  statuses,
  myProfile,
  onAddStatus,
  onOpenStatuses,
}: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, StatusGroup>();

    statuses.forEach(status => {
      const key = status.is_mine ? 'mine' : `contact-${status.contact_id}`;
      const existing = map.get(key);

      if (existing) {
        existing.statuses.push(status);
      } else {
        map.set(key, {
          key,
          name: status.name,
          isMine: status.is_mine ?? false,
          statuses: [status],
        });
      }
    });

    return Array.from(map.values())
      .map(group => ({
        ...group,
        statuses: [...group.statuses].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
      }))
      .sort((a, b) => Number(b.isMine) - Number(a.isMine));
  }, [statuses]);

  const myGroup = groups.find(group => group.isMine);
  const otherGroups = groups.filter(group => !group.isMine);

  const openGroup = (group: StatusGroup) => {
    const firstUnviewedIndex = group.statuses.findIndex(status => !status.viewed);
    onOpenStatuses(
      group.statuses,
      firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0
    );
  };

  const renderGroup = (group: StatusGroup) => {
    const latestStatus = group.statuses[group.statuses.length - 1];

    return (
      <Pressable key={group.key} style={styles.item} onPress={() => openGroup(group)}>
        <View style={styles.previewContainer}>
          <SegmentedRing statuses={group.statuses} />
          <StatusPreview status={latestStatus} />

          {group.isMine && (
            <Pressable
              style={styles.addBadge}
              onPress={event => {
                event.stopPropagation();
                onAddStatus();
              }}
            >
              <Ionicons name="add" size={14} color={light.offWhite} />
            </Pressable>
          )}
        </View>

        <Text style={styles.itemLabel} numberOfLines={1}>
          {group.isMine ? 'My status' : group.name.split(' ')[0]}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Status</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {myGroup ? (
          renderGroup(myGroup)
        ) : (
          <Pressable style={styles.item} onPress={onAddStatus}>
            <View style={styles.previewContainer}>
              <Avatar
                name={myProfile?.name || 'You'}
                color={myProfile?.avatar_color || light.primary}
                photoUrl={myProfile?.photo_url}
                size={PREVIEW_SIZE}
              />
              <View style={styles.addBadge}>
                <Ionicons name="add" size={14} color={light.offWhite} />
              </View>
            </View>
            <Text style={styles.itemLabel}>Add status</Text>
          </Pressable>
        )}

        {otherGroups.map(renderGroup)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  row: { paddingHorizontal: 20, gap: 16 },
  item: { alignItems: 'center', width: 74 },
  previewContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMedia: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
  },
  previewVideoContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  playIcon: { position: 'absolute', left: 20, top: 20 },
  textPreview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  textPreviewLabel: {
    color: light.offWhite,
    fontFamily: fontFamily.semibold,
    fontSize: 9,
    textAlign: 'center',
  },
  addBadge: {
    position: 'absolute',
    right: 1,
    bottom: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: light.primary,
    borderWidth: 2,
    borderColor: light.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.charcoal,
    marginTop: 6,
  },
});
