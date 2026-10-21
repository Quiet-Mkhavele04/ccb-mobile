import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
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
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  Community,
  getCommunities,
  joinCommunity,
  leaveCommunity,
} from '../../api/communitiesApi';

import { light } from '../../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type CommunitiesNavProp =
  NativeStackNavigationProp<
    RootStackParamList,
    'MainTabs'
  >;

const CATEGORIES = [
  'All',
  'Business',
  'Finance',
  'Lifestyle',
  'Education',
  'Sports',
  'Arts',
];

export default function CommunitiesScreen() {
  const navigation =
    useNavigation<CommunitiesNavProp>();

  const [communities, setCommunities] =
    useState<Community[]>([]);

  const [activeCategory, setActiveCategory] =
    useState('All');

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      try {
        const response =
          await getCommunities();

        setCommunities(
          response.communities
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load communities.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return communities.filter(community => {
      const matchesCategory =
        activeCategory === 'All' ||
        community.category === activeCategory;

      const matchesSearch =
        !searchText ||
        community.name
          .toLowerCase()
          .includes(searchText) ||
        community.description
          ?.toLowerCase()
          .includes(searchText);

      return Boolean(
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    communities,
    activeCategory,
    search,
  ]);

  const joined = filtered.filter(
    community => community.joined
  );

  const discover = filtered.filter(
    community => !community.joined
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load(false);
  }

  async function handleToggleJoin(
    community: Community
  ) {
    if (updatingId !== null) {
      return;
    }

    setUpdatingId(
      community.communityId
    );

    try {
      if (community.joined) {
        await leaveCommunity(
          community.communityId
        );
      } else {
        await joinCommunity(
          community.communityId
        );
      }

      await load(false);
    } catch (joinError) {
      Alert.alert(
        community.joined
          ? 'Could not leave community'
          : 'Could not join community',
        joinError instanceof Error
          ? joinError.message
          : 'Please try again.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openDetail(
    community: Community
  ) {
    navigation.navigate(
      'CommunityDetail',
      {
        communityId:
          community.communityId,
      }
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View style={styles.centeredState}>
          <ActivityIndicator
            size="large"
            color={light.primary}
          />

          <Text style={styles.loadingText}>
            Loading communities...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Communities
        </Text>

        <Pressable
          style={styles.headerButton}
          onPress={() =>
            navigation.navigate(
              'CreateCommunity'
            )
          }
        >
          <Ionicons
            name="add"
            size={24}
            color={light.offWhite}
          />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={18}
          color={light.textSecondary}
        />

        <TextInput
          placeholder="Search communities..."
          placeholderTextColor={light.textSecondary}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={8}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={light.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={category => category}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryList}
        renderItem={({ item }) => {
          const active =
            item === activeCategory;

          return (
            <Pressable
              style={[
                styles.categoryChip,
                active &&
                  styles.categoryChipActive,
              ]}
              onPress={() =>
                setActiveCategory(item)
              }
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active &&
                    styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

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

          <Pressable
            onPress={() => void load()}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={discover}
        keyExtractor={community =>
          String(community.communityId)
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={light.primary}
            colors={[light.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {joined.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  Your communities
                </Text>

                {joined.map(community => (
                  <CommunityCard
                    key={community.communityId}
                    community={community}
                    updating={
                      updatingId ===
                      community.communityId
                    }
                    onPress={() =>
                      openDetail(community)
                    }
                    onToggleJoin={() =>
                      void handleToggleJoin(
                        community
                      )
                    }
                  />
                ))}
              </>
            )}

            <Text style={styles.sectionLabel}>
              Discover
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            updating={
              updatingId ===
              item.communityId
            }
            onPress={() =>
              openDetail(item)
            }
            onToggleJoin={() =>
              void handleToggleJoin(item)
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {joined.length > 0
              ? 'No other communities match your filters.'
              : `No communities match "${search}" in ${activeCategory}.`}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

function CommunityCard({
  community,
  updating,
  onPress,
  onToggleJoin,
}: {
  community: Community;
  updating: boolean;
  onPress: () => void;
  onToggleJoin: () => void;
}) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor:
              community.bannerColor ||
              light.primary,
          },
        ]}
      >
        <Ionicons
          name="people"
          size={25}
          color="rgba(255,255,255,0.72)"
        />
      </View>

      <View style={styles.cardBody}>
        <Text
          style={styles.cardName}
          numberOfLines={1}
        >
          {community.name}
        </Text>

        <View style={styles.cardMetaRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {community.category}
            </Text>
          </View>

          <Text style={styles.memberCount}>
            {community.memberCount.toLocaleString()}{' '}
            {community.memberCount === 1
              ? 'member'
              : 'members'}
          </Text>

          {community.isAdmin && (
            <View style={styles.adminTag}>
              <Text style={styles.adminTagText}>
                Admin
              </Text>
            </View>
          )}
        </View>

        {community.description && (
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {community.description}
          </Text>
        )}
      </View>

      <Pressable
        style={[
          styles.joinButton,
          community.joined &&
            styles.joinedButton,
          updating && styles.disabledButton,
        ]}
        disabled={updating}
        onPress={onToggleJoin}
      >
        {updating ? (
          <ActivityIndicator
            size="small"
            color={
              community.joined
                ? light.primary
                : light.offWhite
            }
          />
        ) : (
          <Text
            style={[
              styles.joinButtonText,
              community.joined &&
                styles.joinedButtonText,
            ]}
          >
            {community.joined
              ? 'Joined'
              : 'Join'}
          </Text>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: light.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  categoryList: {
    flexGrow: 0,
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
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
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
    flexWrap: 'wrap',
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
  adminTag: {
    backgroundColor: '#FFF6E6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminTagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.gold,
  },
  description: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 8,
    lineHeight: 17,
  },
  joinButton: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.primary,
  },
  joinedButton: {
    backgroundColor: light.card,
    borderWidth: 1.5,
    borderColor: light.border,
  },
  disabledButton: {
    opacity: 0.6,
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
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEAEA',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.danger,
  },
  retryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.primary,
  },
});
