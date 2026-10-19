import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
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
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import Avatar from '../../components/Avatar';
import StatusRow from '../../components/StatusRow';

import type {
  StatusRowItem,
} from '../../components/StatusRow';

import { light } from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import {
  getProfile,
  Profile,
} from '../../db/database';

import {
  getMyContacts,
} from '../../api/contactsApi';

import type {
  Contact,
} from '../../api/contactsApi';

import {
  getChatConnection,
  startChatConnection,
} from '../../api/chatHub';

import {
  getStatuses,
} from '../../api/statusesApi';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type HomeNavProp =
  NativeStackNavigationProp<
    RootStackParamList,
    'MainTabs'
  >;

type PresenceChangedEvent = {
  profileId: number;
  isOnline: boolean;
};

export default function HomeScreen() {
  const navigation =
    useNavigation<HomeNavProp>();

  const [contacts, setContacts] =
    useState<Contact[]>([]);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [statuses, setStatuses] =
    useState<StatusRowItem[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadHome =
    useCallback(
      async (
        showLoading = true
      ) => {
        setProfile(getProfile());

        try {
          if (showLoading) {
            setLoading(true);
            setError('');
          }

          const [
            contactsResult,
            statusesResult,
          ] = await Promise.all([
            getMyContacts(),
            getStatuses(),
          ]);

          console.log(
            'Contacts loaded from API:',
            contactsResult.contacts
          );

          setContacts(
            contactsResult.contacts
          );

          const mappedStatuses:
            StatusRowItem[] =
            statusesResult.statuses.map(
              status => ({
                status_id:
                  status.statusId,

                contact_id:
                  status.contactId,

                name:
                  status.name,

                avatar_color:
                  status.avatarColor ||
                  light.primary,

                photo_url:
                  status.profilePhotoUrl,

                media_type:
                  status.mediaType,

                media_url:
                  status.mediaUrl,

                caption:
                  status.caption,

                bg_color:
                  status.backgroundColor ||
                  light.primary,

                timestamp:
                  status.createdAt,

                viewed:
                  status.viewed
                    ? 1
                    : 0,

                is_mine:
                  status.isMine,
              })
            );

          setStatuses(
            mappedStatuses
          );
        } catch (requestError) {
          console.error(
            'Unable to load Home:',
            requestError
          );

          if (showLoading) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : 'Unable to load contacts.'
            );
          }
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      void loadHome(true);

      const connection =
        getChatConnection();

      const refreshContacts =
        () => {
          void loadHome(false);
        };

      const handlePresenceChanged =
        (
          presence:
            PresenceChangedEvent
        ) => {
          setContacts(previous =>
            previous.map(contact =>
              contact.profileId ===
              presence.profileId
                ? {
                    ...contact,

                    isOnline:
                      presence.isOnline,
                  }
                : contact
            )
          );
        };

      connection.on(
        'MessageReceived',
        refreshContacts
      );

      connection.on(
        'MessageUpdated',
        refreshContacts
      );

      connection.on(
        'MessageDeleted',
        refreshContacts
      );

      connection.on(
        'MessagesRead',
        refreshContacts
      );

      connection.on(
        'PresenceChanged',
        handlePresenceChanged
      );

      connection.on(
        'StatusesChanged',
        refreshContacts
      );

      void startChatConnection()
        .catch(
          connectionError => {
            console.error(
              'Unable to start Home SignalR:',
              connectionError
            );
          }
        );

      const fallbackTimer =
        setInterval(() => {
          void loadHome(false);
        }, 15000);

      return () => {
        clearInterval(
          fallbackTimer
        );

        connection.off(
          'MessageReceived',
          refreshContacts
        );

        connection.off(
          'MessageUpdated',
          refreshContacts
        );

        connection.off(
          'MessageDeleted',
          refreshContacts
        );

        connection.off(
          'MessagesRead',
          refreshContacts
        );

        connection.off(
          'PresenceChanged',
          handlePresenceChanged
        );

        connection.off(
          'StatusesChanged',
          refreshContacts
        );
      };
    }, [loadHome])
  );

  const onlineContacts =
    contacts.filter(
      contact =>
        contact.isOnline
    );

  const pinnedContacts =
    contacts.filter(
      contact =>
        contact.pinned
    );

  const regularContacts =
    contacts.filter(
      contact =>
        !contact.pinned
    );

  const filteredContacts =
    search.trim().length > 0
      ? contacts.filter(contact =>
          contact.name
            .toLowerCase()
            .includes(
              search
                .trim()
                .toLowerCase()
            )
        )
      : regularContacts;

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={styles.greeting}
          >
            Hello
            {profile?.name
              ? `, ${
                  profile.name
                    .split(' ')[0]
                }`
              : ''}
            {' 👋'}
          </Text>

          <Text
            style={styles.username}
          >
            Let&apos;s connect today
          </Text>
        </View>

        <Avatar
          name={
            profile?.name ||
            'You'
          }
          color={
            profile?.avatar_color ||
            light.gold
          }
          photoUrl={
            profile?.photo_url
          }
          size={44}
        />
      </View>

      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={18}
          color={
            light.textSecondary
          }
        />

        <TextInput
          placeholder=
            "Search contacts..."
          placeholderTextColor={
            light.textSecondary
          }
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <StatusRow
        statuses={statuses}
        myProfile={profile}
        onAddStatus={() => {
          navigation.navigate(
            'CreateStatus'
          );
        }}
        onOpenStatuses={(
          groupStatuses,
          initialIndex
        ) =>
          navigation.navigate(
            'StatusViewer',
            {
              statuses:
                groupStatuses.map(
                  status => ({
                    statusId:
                      status.status_id,

                    name:
                      status.name,

                    avatarColor:
                      status.avatar_color,

                    photoUrl:
                      status.photo_url ||
                      null,

                    caption:
                      status.caption,

                    bgColor:
                      status.bg_color,

                    timestamp:
                      status.timestamp,

                    isMine:
                      status.is_mine ??
                      false,

                    viewed:
                      status.viewed ===
                      1,

                    mediaType:
                      status.media_type ||
                      null,

                    mediaUrl:
                      status.media_url ||
                      null,
                  })
                ),

              initialIndex,
            }
          )
        }
      />

      {onlineContacts.length >
        0 && (
        <View
          style={
            styles.activeSection
          }
        >
          <Text
            style={
              styles.sectionLabel
            }
          >
            Active now
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.activeRow
            }
          >
            {onlineContacts.map(
              contact => (
                <Pressable
                  key={
                    contact.contactId
                  }
                  style={
                    styles.activeItem
                  }
                  onPress={() =>
                    openContact(
                      navigation,
                      contact
                    )
                  }
                >
                  <Avatar
                    name={
                      contact.name
                    }
                    color={
                      contact
                        .avatarColor ||
                      light.primary
                    }
                    photoUrl={
                      contact
                        .profilePhotoUrl
                    }
                    size={56}
                    online
                  />

                  <Text
                    style={
                      styles.activeName
                    }
                    numberOfLines={1}
                  >
                    {
                      contact.name
                        .split(' ')[0]
                    }
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>
        </View>
      )}

      {loading && (
        <View
          style={styles.messageBox}
        >
          <ActivityIndicator
            color={light.primary}
            size="large"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading contacts...
          </Text>
        </View>
      )}

      {!loading &&
        error.length > 0 && (
          <View
            style={
              styles.messageBox
            }
          >
            <Ionicons
              name=
                "cloud-offline-outline"
              size={38}
              color={light.danger}
            />

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.retryButton
              }
              onPress={() => {
                void loadHome();
              }}
            >
              <Text
                style={
                  styles
                    .retryButtonText
                }
              >
                Try again
              </Text>
            </Pressable>
          </View>
        )}

      {!loading &&
        error.length === 0 && (
          <FlatList
            data={
              filteredContacts
            }
            keyExtractor={
              contact =>
                String(
                  contact.contactId
                )
            }
            contentContainerStyle={
              styles.list
            }
            ListHeaderComponent={
              !search.trim() &&
              pinnedContacts.length >
                0 ? (
                <View>
                  <Text
                    style={
                      styles
                        .sectionLabelList
                    }
                  >
                    📌 Pinned
                  </Text>

                  {pinnedContacts.map(
                    contact => (
                      <ContactRow
                        key={
                          contact
                            .contactId
                        }
                        contact={
                          contact
                        }
                      />
                    )
                  )}

                  <Text
                    style={[
                      styles
                        .sectionLabelList,
                      styles
                        .contactsHeading,
                    ]}
                  >
                    Contacts
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View
                style={
                  styles.emptyBox
                }
              >
                <Ionicons
                  name=
                    "people-outline"
                  size={42}
                  color={
                    light
                      .textSecondary
                  }
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  {search.trim()
                    ? 'No contacts found'
                    : 'No contacts yet'}
                </Text>

                <Text
                  style={
                    styles
                      .emptySubtitle
                  }
                >
                  {search.trim()
                    ? 'Try a different name.'
                    : 'Add contacts to start chatting.'}
                </Text>
              </View>
            }
            renderItem={({
              item,
            }) => (
              <ContactRow
                contact={item}
              />
            )}
            showsVerticalScrollIndicator={
              false
            }
          />
        )}

      <Pressable
        style={styles.fab}
        onPress={() =>
          navigation.navigate(
            'AddContact'
          )
        }
      >
        <Ionicons
          name="add"
          size={28}
          color={light.charcoal}
        />
      </Pressable>
    </SafeAreaView>
  );
}

function formatContactTime(
  value: string | null
) {
  if (!value) {
    return '';
  }

  const normalizedValue =
    value.endsWith('Z') ||
    /[+-]\d\d:\d\d$/.test(value)
      ? value
      : `${value}Z`;

  const date =
    new Date(normalizedValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const now = new Date();

  const isToday =
    date.getDate() ===
      now.getDate() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getFullYear() ===
      now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  }

  return date.toLocaleDateString(
    [],
    {
      day: '2-digit',
      month: 'short',
    }
  );
}

function openContact(
  navigation: HomeNavProp,
  contact: Contact
) {
  navigation.navigate(
    'Chat',
    {
      contactId:
        contact.contactId,

      name:
        contact.name,

      avatarColor:
        contact.avatarColor ||
        light.primary,

      photoUrl:
        contact.profilePhotoUrl ||
        null,

      isOnline:
        contact.isOnline,
    }
  );
}

function ContactRow({
  contact,
}: {
  contact: Contact;
}) {
  const navigation =
    useNavigation<HomeNavProp>();

  const hasMessage =
    Boolean(
      contact.lastMessageText
    );

  const previewText =
    hasMessage
      ? `${
          contact
            .lastMessageIsMine
            ? 'You: '
            : ''
        }${
          contact.lastMessageText
        }`
      : 'Say hello 👋';

  const messageTime =
    formatContactTime(
      contact.lastMessageSentAt
    );

  const hasUnreadMessages =
    contact.unreadCount > 0;

  return (
    <Pressable
      style={styles.chatRow}
      onPress={() =>
        openContact(
          navigation,
          contact
        )
      }
    >
      <Avatar
        name={contact.name}
        color={
          contact.avatarColor ||
          light.primary
        }
        photoUrl={
          contact.profilePhotoUrl
        }
        size={52}
        online={
          contact.isOnline
        }
      />

      <View
        style={
          styles.chatTextBlock
        }
      >
        <View
          style={
            styles.chatTopLine
          }
        >
          <Text
            style={styles.chatName}
            numberOfLines={1}
          >
            {contact.name}
          </Text>

          {messageTime.length >
            0 && (
            <Text
              style={[
                styles.chatTime,

                hasUnreadMessages &&
                  styles
                    .chatTimeUnread,
              ]}
            >
              {messageTime}
            </Text>
          )}
        </View>

        <View
          style={
            styles.chatBottomLine
          }
        >
          <Text
            style={[
              styles.chatPreview,

              hasUnreadMessages &&
                styles
                  .chatPreviewUnread,
            ]}
            numberOfLines={1}
          >
            {previewText}
          </Text>

          {contact
            .lastMessageTranslated && (
            <Ionicons
              name="language"
              size={14}
              color={
                light.primary
              }
              style={
                styles.languageIcon
              }
            />
          )}
        </View>
      </View>

      {hasUnreadMessages && (
        <View
          style={
            styles.unreadBadge
          }
        >
          <Text
            style={
              styles.unreadText
            }
          >
            {contact.unreadCount >
            99
              ? '99+'
              : contact.unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      light.offWhite,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  greeting: {
    fontFamily:
      fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },

  username: {
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.sm,
    color:
      light.textSecondary,
    marginTop: 2,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      light.card,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontFamily:
      fontFamily.regular,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },

  activeSection: {
    marginTop: 18,
  },

  sectionLabel: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.sm,
    color:
      light.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  sectionLabelList: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.sm,
    color:
      light.textSecondary,
    marginBottom: 10,
  },

  contactsHeading: {
    marginTop: 8,
  },

  activeRow: {
    paddingHorizontal: 20,
    gap: 16,
  },

  activeItem: {
    alignItems: 'center',
    width: 64,
  },

  activeName: {
    fontFamily:
      fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.charcoal,
    marginTop: 6,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 100,
    flexGrow: 1,
  },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },

  chatTextBlock: {
    flex: 1,
  },

  chatTopLine: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  chatName: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
    flexShrink: 1,
  },

  chatTime: {
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.xs,
    color:
      light.textSecondary,
    marginLeft: 10,
  },

  chatTimeUnread: {
    color: light.primary,
    fontFamily:
      fontFamily.semibold,
  },

  chatBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  chatPreview: {
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.sm,
    color:
      light.textSecondary,
    flexShrink: 1,
  },

  chatPreviewUnread: {
    color: light.charcoal,
    fontFamily:
      fontFamily
        .secondaryMedium,
  },

  languageIcon: {
    marginLeft: 6,
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor:
      light.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unreadText: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.charcoal,
  },

  messageBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.sm,
    color:
      light.textSecondary,
    marginTop: 12,
  },

  errorText: {
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.danger,
    textAlign: 'center',
    marginTop: 12,
  },

  retryButton: {
    marginTop: 16,
    backgroundColor:
      light.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  retryButtonText: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },

  emptyTitle: {
    fontFamily:
      fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
    marginTop: 12,
  },

  emptySubtitle: {
    fontFamily:
      fontFamily.secondary,
    fontSize: fontSize.sm,
    color:
      light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor:
      light.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 6,
  },
});