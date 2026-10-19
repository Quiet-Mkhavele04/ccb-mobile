import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { getCommunities, toggleJoinCommunity, Community } from '../../db/database';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type CommunitiesNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const CATEGORIES = ['All', 'Business', 'Finance', 'Lifestyle', 'Education', 'Sports', 'Arts'];

export default function CommunitiesScreen() {
  const navigation = useNavigation<CommunitiesNavProp>();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setCommunities(getCommunities());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return communities.filter((c) => {
      const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
      const matchesSearch = c.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [communities, activeCategory, search]);

  const joined = filtered.filter((c) => c.joined === 1);
  const discover = filtered.filter((c) => c.joined === 0);

  const handleToggleJoin = (id: number) => {
    toggleJoinCommunity(id);
    load();
  };

  const openDetail = (community: Community) => {
    navigation.navigate('CommunityDetail', { communityId: community.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={light.textSecondary} />
        <TextInput
          placeholder="Search communities..."
          placeholderTextColor={light.textSecondary}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(c) => c}
        contentContainerStyle={styles.categoryRow}
        renderItem={({ item }) => {
          const active = item === activeCategory;
          return (
            <Pressable
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={discover}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {joined.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Your communities</Text>
                {joined.map((c) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    onPress={() => openDetail(c)}
                    onToggleJoin={() => handleToggleJoin(c.id)}
                  />
                ))}
              </>
            )}
            <Text style={styles.sectionLabel}>Discover</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            onPress={() => openDetail(item)}
            onToggleJoin={() => handleToggleJoin(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No communities match "{search}" in {activeCategory}.</Text>
        }
      />
    </SafeAreaView>
  );
}

function CommunityCard({
  community,
  onPress,
  onToggleJoin,
}: {
  community: Community;
  onPress: () => void;
  onToggleJoin: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.banner, { backgroundColor: community.banner_color || light.primary }]} />
      <View style={styles.cardBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>
            {community.name}
          </Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{community.category}</Text>
            </View>
            <Text style={styles.memberCount}>
              {community.member_count.toLocaleString()} members
            </Text>
          </View>
          {community.description && (
            <Text style={styles.description} numberOfLines={2}>
              {community.description}
            </Text>
          )}
        </View>
      </View>
      <Pressable
        style={[styles.joinButton, community.joined === 1 && styles.joinedButton]}
        onPress={onToggleJoin}
      >
        <Text style={[styles.joinButtonText, community.joined === 1 && styles.joinedButtonText]}>
          {community.joined === 1 ? 'Joined' : 'Join'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  categoryRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
  },
  categoryChipActive: {
    backgroundColor: light.primary,
    borderColor: light.primary,
  },
  categoryChipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },
  categoryChipTextActive: {
    color: light.offWhite,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: light.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  banner: {
    height: 44,
  },
  cardBody: {
    flexDirection: 'row',
    padding: 14,
  },
  cardName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
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
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  joinButton: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    paddingVertical: 10,
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
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  joinedButtonText: {
    color: light.textSecondary,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 30,
  },
});
