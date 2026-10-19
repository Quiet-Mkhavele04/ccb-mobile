import React, {
  useCallback,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from
  'react-native-safe-area-context';
import { Ionicons } from
  '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import Avatar from
  '../../components/Avatar';
import { light } from
  '../../theme/colors';
import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import {
  getProfile,
  getProfileStats,
  setDarkModePref,
} from '../../db/database';

import type {
  Profile,
  ProfileStats,
} from '../../db/database';

type SettingsRow = {
  icon:
    keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
};

type Props = {
  onLogout: () => Promise<void> | void;
};

const SETTINGS_ROWS: SettingsRow[] = [
  {
    icon: 'person-outline',
    label: 'Edit profile',
  },
  {
    icon: 'notifications-outline',
    label: 'Notifications',
  },
  {
    icon: 'lock-closed-outline',
    label: 'Privacy',
  },
  {
    icon: 'globe-outline',
    label: 'Language',
  },
  {
    icon: 'help-circle-outline',
    label: 'Help & support',
  },
  {
    icon: 'information-circle-outline',
    label: 'About CCB',
  },
];

export default function ProfileScreen({
  onLogout,
}: Props) {
  const navigation =
    useNavigation<any>();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [stats, setStats] =
    useState<ProfileStats>({
      contactsCount: 0,
      communitiesCount: 0,
      transactionsCount: 0,
    });

  const [darkMode, setDarkMode] =
    useState(false);

  const load = useCallback(() => {
    const currentProfile =
      getProfile();

    setProfile(currentProfile);

    setDarkMode(
      currentProfile?.dark_mode === 1
    );

    setStats(getProfileStats());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggleDarkMode = (
    value: boolean
  ) => {
    setDarkMode(value);
    setDarkModePref(value);
  };

  const handleSettingsPress = (
    label: string
  ) => {
    if (label === 'Edit profile') {
      navigation.navigate(
        'EditProfile'
      );

      return;
    }

    Alert.alert(
      label,
      `${label} screen coming soon.`
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of CCB?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void onLogout();
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scroll
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Profile
          </Text>
        </View>

        <View style={styles.profileCard}>
          {profile.photo_url ? (
            <Image
              source={{
                uri: profile.photo_url,
              }}
              style={styles.profilePhoto}
              resizeMode="cover"
            />
          ) : (
            <Avatar
              name={profile.name || 'You'}
              color={profile.avatar_color}
              size={84}
            />
          )}

          <Text style={styles.name}>
            {profile.name}
          </Text>

          <Text style={styles.username}>
            @{profile.username}
          </Text>

          <Text style={styles.phone}>
            {profile.phone}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatItem
            label="Chats"
            value={stats.contactsCount}
          />

          <View
            style={styles.statDivider}
          />

          <StatItem
            label="Communities"
            value={
              stats.communitiesCount
            }
          />

          <View
            style={styles.statDivider}
          />

          <StatItem
            label="Transactions"
            value={
              stats.transactionsCount
            }
          />
        </View>

        <View style={styles.settingsGroup}>
          <View style={styles.settingsRow}>
            <View
              style={
                styles.settingsRowLeft
              }
            >
              <View
                style={styles.iconCircle}
              >
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={light.primary}
                />
              </View>

              <Text
                style={
                  styles.settingsLabel
                }
              >
                Dark mode
              </Text>
            </View>

            <Switch
              value={darkMode}
              onValueChange={
                handleToggleDarkMode
              }
              trackColor={{
                false: light.border,
                true: light.primary,
              }}
              thumbColor={
                light.offWhite
              }
            />
          </View>
        </View>

        <View style={styles.settingsGroup}>
          {SETTINGS_ROWS.map(
            (row, index) => (
              <Pressable
                key={row.label}
                style={[
                  styles.settingsRow,

                  index <
                    SETTINGS_ROWS.length -
                      1 &&
                    styles
                      .settingsRowBorder,
                ]}
                onPress={() =>
                  handleSettingsPress(
                    row.label
                  )
                }
              >
                <View
                  style={
                    styles.settingsRowLeft
                  }
                >
                  <View
                    style={
                      styles.iconCircle
                    }
                  >
                    <Ionicons
                      name={row.icon}
                      size={18}
                      color={
                        light.primary
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.settingsLabel
                    }
                  >
                    {row.label}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={
                    light.textSecondary
                  }
                />
              </Pressable>
            )
          )}
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={light.danger}
          />

          <Text style={styles.logoutText}>
            Log out
          </Text>
        </Pressable>

        <Text style={styles.versionText}>
          CCB v1.0.0 — Connect.
          Communicate. Belong.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
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

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    paddingTop: 8,
  },

  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
  },

  profileCard: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  profilePhoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: light.border,
    borderWidth: 2,
    borderColor: light.primary,
  },

  name: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
    marginTop: 12,
  },

  username: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 2,
  },

  phone: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: light.border,
    paddingVertical: 16,
    marginBottom: 24,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },

  statLabel: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: light.border,
  },

  settingsGroup: {
    backgroundColor: light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: light.border,
    marginBottom: 16,
    overflow: 'hidden',
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },

  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FBD9D9',
    backgroundColor: '#FDEAEA',
    marginTop: 4,
  },

  logoutText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.danger,
  },

  versionText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
});
