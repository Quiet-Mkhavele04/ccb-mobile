import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { getCommunities, toggleJoinCommunity, Community } from '../../db/database';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type DetailRouteProp = RouteProp<RootStackParamList, 'CommunityDetail'>;
type DetailNavProp = NativeStackNavigationProp<RootStackParamList, 'CommunityDetail'>;

const TABS = ['Chat', 'Events', 'Jobs', 'Marketplace'] as const;
type Tab = (typeof TABS)[number];

// Mock content per tab - swap for real queries once those features have their own tables.
const MOCK_EVENTS = [
  { title: 'Monthly meetup', detail: 'Sat 27 Sep · 14:00 · Community Hall' },
  { title: 'Guest speaker session', detail: 'Wed 1 Oct · 18:00 · Online' },
];
const MOCK_JOBS = [
  { title: 'Delivery driver needed', detail: 'Part-time · Posted by a member' },
  { title: 'Social media help wanted', detail: 'Freelance · R150/hr' },
];
const MOCK_MARKETPLACE = [
  { title: 'Handmade beadwork', detail: 'R120 · Pickup in Soweto' },
  { title: 'Second-hand fridge', detail: 'R850 · Delivery available' },
];

export default function CommunityDetailScreen() {
  const navigation = useNavigation<DetailNavProp>();
  const route = useRoute<DetailRouteProp>();
  const { communityId } = route.params;

  const [community, setCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Chat');

  useEffect(() => {
    const found = getCommunities().find((c) => c.id === communityId) || null;
    setCommunity(found);
  }, [communityId]);

  if (!community) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading community...</Text>
      </SafeAreaView>
    );
  }

  const handleToggleJoin = () => {
    toggleJoinCommunity(community.id);
    setCommunity(getCommunities().find((c) => c.id === community.id) || null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.banner, { backgroundColor: community.banner_color || light.primary }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={light.offWhite} />
        </Pressable>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.name}>{community.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{community.category}</Text>
          </View>
          <Text style={styles.memberCount}>
            {community.member_count.toLocaleString()} members
          </Text>
        </View>
        {community.description && <Text style={styles.description}>{community.description}</Text>}

        <Pressable
          style={[styles.joinButton, community.joined === 1 && styles.joinedButton]}
          onPress={handleToggleJoin}
        >
          <Text style={[styles.joinButtonText, community.joined === 1 && styles.joinedButtonText]}>
            {community.joined === 1 ? 'Joined ✓' : 'Join community'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Chat' && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={32} color={light.textSecondary} />
            <Text style={styles.emptyText}>
              {community.joined === 1
                ? 'Group chat coming soon — this will show the shared community thread.'
                : 'Join this community to see and take part in the group chat.'}
            </Text>
          </View>
        )}

        {activeTab === 'Events' &&
          MOCK_EVENTS.map((e, i) => (
            <View key={i} style={styles.listCard}>
              <Ionicons name="calendar-outline" size={20} color={light.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.listCardTitle}>{e.title}</Text>
                <Text style={styles.listCardDetail}>{e.detail}</Text>
              </View>
            </View>
          ))}

        {activeTab === 'Jobs' &&
          MOCK_JOBS.map((j, i) => (
            <View key={i} style={styles.listCard}>
              <Ionicons name="briefcase-outline" size={20} color={light.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.listCardTitle}>{j.title}</Text>
                <Text style={styles.listCardDetail}>{j.detail}</Text>
              </View>
            </View>
          ))}

        {activeTab === 'Marketplace' &&
          MOCK_MARKETPLACE.map((m, i) => (
            <View key={i} style={styles.listCard}>
              <Ionicons name="pricetag-outline" size={20} color={light.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.listCardTitle}>{m.title}</Text>
                <Text style={styles.listCardDetail}>{m.detail}</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  loadingText: {
    fontFamily: fontFamily.secondary,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  banner: {
    height: 120,
    justifyContent: 'flex-start',
  },
  backButton: {
    marginTop: 12,
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  categoryTag: {
    backgroundColor: '#EAF3EF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryTagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.primary,
  },
  memberCount: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  description: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  joinButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: light.primary,
  },
  joinedButton: {
    backgroundColor: light.card,
    borderWidth: 1.5,
    borderColor: light.border,
  },
  joinButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.offWhite,
  },
  joinedButtonText: {
    color: light.primary,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
    paddingHorizontal: 20,
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 10,
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },
  tabLabelActive: {
    color: light.primary,
    fontFamily: fontFamily.semibold,
  },
  tabIndicator: {
    marginTop: 6,
    height: 3,
    width: '100%',
    borderRadius: 2,
    backgroundColor: light.primary,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    padding: 14,
    marginBottom: 12,
  },
  listCardTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  listCardDetail: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 2,
  },
});
