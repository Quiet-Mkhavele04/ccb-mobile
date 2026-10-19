import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';
import { getBusinesses, getEvents, Business, EventItem } from '../../db/database';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type DiscoverNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const CATEGORIES = ['All', 'Food', 'Beauty', 'Automotive', 'Services', 'Retail', 'Health'];

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverNavProp>();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setBusinesses(getBusinesses());
    setEvents(getEvents());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const featured = useMemo(() => businesses.filter((b) => b.featured === 1), [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const matchesCategory = activeCategory === 'All' || b.category === activeCategory;
      const matchesSearch = b.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [businesses, activeCategory, search]);

  const openBusiness = (id: number) => {
    navigation.navigate('BusinessProfile', { businessId: id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={light.textSecondary} />
        <TextInput
          placeholder="Search businesses..."
          placeholderTextColor={light.textSecondary}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredBusinesses}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Featured businesses */}
            {featured.length > 0 && !search.trim() && (
              <>
                <Text style={styles.sectionLabel}>Featured businesses</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {featured.map((b) => (
                    <Pressable key={b.id} style={styles.featuredCard} onPress={() => openBusiness(b.id)}>
                      <View style={[styles.featuredBanner, { backgroundColor: b.banner_color }]} />
                      <View style={styles.featuredBody}>
                        <Text style={styles.featuredName} numberOfLines={1}>
                          {b.name}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={12} color={light.gold} />
                          <Text style={styles.ratingText}>{b.rating.toFixed(1)}</Text>
                          <Text style={styles.featuredCategory}>· {b.category}</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Upcoming events */}
            {!search.trim() && (
              <>
                <Text style={styles.sectionLabel}>Upcoming events</Text>
                {events.map((e) => (
                  <View key={e.id} style={styles.eventCard}>
                    <View style={[styles.eventBanner, { backgroundColor: e.banner_color }]} />
                    <View style={styles.eventBody}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {e.title}
                      </Text>
                      <Text style={styles.eventMeta}>
                        {e.date_label} · {e.location}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Category filters */}
            <Text style={styles.sectionLabel}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>
              {activeCategory === 'All' ? 'All businesses' : activeCategory}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.businessRow} onPress={() => openBusiness(item.id)}>
            <View style={[styles.businessThumb, { backgroundColor: item.banner_color }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.businessName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={light.gold} />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                <Text style={styles.featuredCategory}>· {item.category}</Text>
              </View>
              {item.address && (
                <Text style={styles.businessAddress} numberOfLines={1}>
                  {item.address}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={light.textSecondary} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No businesses match "{search}".</Text>
        }
      />
    </SafeAreaView>
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 20,
    marginBottom: 10,
  },
  featuredRow: {
    gap: 12,
  },
  featuredCard: {
    width: 160,
    backgroundColor: light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    overflow: 'hidden',
  },
  featuredBanner: {
    height: 70,
  },
  featuredBody: {
    padding: 10,
  },
  featuredName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  ratingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.charcoal,
  },
  featuredCategory: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  eventBanner: {
    width: 8,
  },
  eventBody: {
    padding: 12,
    flex: 1,
  },
  eventTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  eventMeta: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 3,
  },
  categoryRow: {
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
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    padding: 10,
    marginBottom: 10,
  },
  businessThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  businessName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  businessAddress: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 30,
  },
});
