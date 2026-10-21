import React, {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
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
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import {
  Community,
  CommunityMessage,
  getCommunity,
  getCommunityMessages,
  joinCommunity,
  leaveCommunity,
  sendCommunityMessage,
} from '../../api/communitiesApi';

import { light } from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type DetailRouteProp = RouteProp<
  RootStackParamList,
  'CommunityDetail'
>;

type DetailNavProp =
  NativeStackNavigationProp<
    RootStackParamList,
    'CommunityDetail'
  >;

const TABS = [
  'Chat',
  'Events',
  'Jobs',
  'Marketplace',
] as const;

type Tab = (typeof TABS)[number];

export default function CommunityDetailScreen() {
  const navigation =
    useNavigation<DetailNavProp>();

  const route =
    useRoute<DetailRouteProp>();

  const { communityId } = route.params;

  const listRef =
    useRef<FlatList<CommunityMessage>>(null);

  const [community, setCommunity] =
    useState<Community | null>(null);

  const [messages, setMessages] =
    useState<CommunityMessage[]>([]);

  const [activeTab, setActiveTab] =
    useState<Tab>('Chat');

  const [messageText, setMessageText] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);

      try {
        const communityResponse =
          await getCommunity(communityId);

        const nextCommunity =
          communityResponse.community;

        setCommunity(nextCommunity);

        if (nextCommunity.joined) {
          const messagesResponse =
            await getCommunityMessages(
              communityId
            );

          setMessages(
            messagesResponse.messages
          );
        } else {
          setMessages([]);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    },
    [communityId]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function refresh() {
    setRefreshing(true);

    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  }

  async function join() {
    if (!community || updating) {
      return;
    }

    setUpdating(true);

    try {
      await joinCommunity(
        community.communityId
      );

      await load(false);
    } catch (joinError) {
      Alert.alert(
        'Could not join community',
        getErrorMessage(joinError)
      );
    } finally {
      setUpdating(false);
    }
  }

  function confirmLeave() {
    if (!community || updating) {
      return;
    }

    if (community.isAdmin) {
      Alert.alert(
        'Administrator account',
        'Add another administrator before leaving this community.'
      );
      return;
    }

    Alert.alert(
      'Leave community?',
      `You will no longer have access to ${community.name}'s member content.`,
      [
        {
          text: 'Stay',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            void leave();
          },
        },
      ]
    );
  }

  async function leave() {
    if (!community) {
      return;
    }

    setUpdating(true);

    try {
      await leaveCommunity(
        community.communityId
      );

      await load(false);
    } catch (leaveError) {
      Alert.alert(
        'Could not leave community',
        getErrorMessage(leaveError)
      );
    } finally {
      setUpdating(false);
    }
  }

  async function sendMessage() {
    const trimmedMessage =
      messageText.trim();

    if (
      !community ||
      !community.joined ||
      !trimmedMessage ||
      sending
    ) {
      return;
    }

    setSending(true);

    try {
      const response =
        await sendCommunityMessage(
          community.communityId,
          trimmedMessage
        );

      setMessages(current => [
        ...current,
        response.communityMessage,
      ]);

      setMessageText('');

      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({
          animated: true,
        });
      });
    } catch (sendError) {
      Alert.alert(
        'Could not send message',
        getErrorMessage(sendError)
      );
    } finally {
      setSending(false);
    }
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
            Loading community...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View style={styles.errorHeader}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={light.charcoal}
            />
          </Pressable>
        </View>

        <View style={styles.centeredState}>
          <Ionicons
            name="alert-circle-outline"
            size={38}
            color={light.danger}
          />

          <Text style={styles.errorTitle}>
            Community unavailable
          </Text>

          <Text style={styles.errorText}>
            {error ||
              'This community could not be found.'}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => void load()}
          >
            <Text style={styles.retryButtonText}>
              Try again
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const canSend =
    messageText.trim().length > 0 &&
    !sending;

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
    keyboardVerticalOffset={0}
  >
        <CommunityHeader
          community={community}
          updating={updating}
          onBack={() => navigation.goBack()}
          onMembershipPress={
            community.joined
              ? confirmLeave
              : () => void join()
          }
        />

        <View style={styles.tabRow}>
          {TABS.map(tab => {
            const active =
              tab === activeTab;

            return (
              <Pressable
                key={tab}
                style={styles.tabItem}
                onPress={() =>
                  setActiveTab(tab)
                }
              >
                <Text
                  style={[
                    styles.tabLabel,
                    active &&
                      styles.tabLabelActive,
                  ]}
                >
                  {tab}
                </Text>

                {active && (
                  <View
                    style={styles.tabIndicator}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'Chat' ? (
          community.joined ? (
            <View style={styles.chatArea}>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={item =>
                  String(
                    item.communityMessageId
                  )
                }
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                  />
                )}
                contentContainerStyle={[
                  styles.messagesContent,
                  messages.length === 0 &&
                    styles.emptyMessagesContent,
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() =>
                      void refresh()
                    }
                    tintColor={light.primary}
                    colors={[light.primary]}
                  />
                }
                ListEmptyComponent={
                  <ChatEmptyState />
                }
                onContentSizeChange={() => {
                  if (messages.length > 0) {
                    listRef.current?.scrollToEnd({
                      animated: false,
                    });
                  }
                }}
              />

              <View style={styles.composer}>
                <TextInput
                  style={styles.messageInput}
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Message the community..."
                  placeholderTextColor={
                    light.textSecondary
                  }
                  multiline
                  maxLength={2000}
                />

                <Pressable
                  style={[
                    styles.sendButton,
                    !canSend &&
                      styles.sendButtonDisabled,
                  ]}
                  disabled={!canSend}
                  onPress={() =>
                    void sendMessage()
                  }
                >
                  {sending ? (
                    <ActivityIndicator
                      size="small"
                      color={light.offWhite}
                    />
                  ) : (
                    <Ionicons
                      name="send"
                      size={20}
                      color={light.offWhite}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={
                styles.tabContent
              }
            >
              <TabEmptyState
                tab="Chat"
                joined={false}
              />
            </ScrollView>
          )
        ) : (
          <ScrollView
            contentContainerStyle={
              styles.tabContent
            }
            showsVerticalScrollIndicator={false}
          >
            <TabEmptyState
              tab={activeTab}
              joined={community.joined}
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommunityHeader({
  community,
  updating,
  onBack,
  onMembershipPress,
}: {
  community: Community;
  updating: boolean;
  onBack: () => void;
  onMembershipPress: () => void;
}) {
  return (
    <>
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
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={light.offWhite}
          />
        </Pressable>

        <View style={styles.bannerIcon}>
          <Ionicons
            name="people"
            size={38}
            color="rgba(255,255,255,0.70)"
          />
        </View>

        {community.isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={light.offWhite}
            />

            <Text style={styles.adminBadgeText}>
              Admin
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoBlock}>
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {community.name}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.categoryTag}>
                <Text
                  style={styles.categoryTagText}
                >
                  {community.category}
                </Text>
              </View>

              <Text style={styles.memberCount}>
                {community.memberCount.toLocaleString()}{' '}
                {community.memberCount === 1
                  ? 'member'
                  : 'members'}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.compactJoinButton,
              community.joined &&
                styles.compactJoinedButton,
              updating && styles.disabledButton,
            ]}
            disabled={updating}
            onPress={onMembershipPress}
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
                  styles.compactJoinText,
                  community.joined &&
                    styles.compactJoinedText,
                ]}
              >
                {community.isAdmin
                  ? 'Admin'
                  : community.joined
                    ? 'Joined'
                    : 'Join'}
              </Text>
            )}
          </Pressable>
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
    </>
  );
}

function MessageBubble({
  message,
}: {
  message: CommunityMessage;
}) {
  const initial =
    message.senderName
      .trim()
      .charAt(0)
      .toUpperCase() || '?';

  return (
    <View
      style={[
        styles.messageRow,
        message.isMe && styles.myMessageRow,
      ]}
    >
      {!message.isMe &&
        (message.profilePhotoUrl ? (
          <Image
            source={{
              uri: message.profilePhotoUrl,
            }}
            style={styles.messageAvatar}
          />
        ) : (
          <View
            style={[
              styles.messageAvatar,
              styles.avatarFallback,
              {
                backgroundColor:
                  message.avatarColor ||
                  light.primary,
              },
            ]}
          >
            <Text style={styles.avatarInitial}>
              {initial}
            </Text>
          </View>
        ))}

      <View
        style={[
          styles.messageBubble,
          message.isMe
            ? styles.myMessageBubble
            : styles.otherMessageBubble,
        ]}
      >
        {!message.isMe && (
          <Text style={styles.senderName}>
            {message.senderName}
          </Text>
        )}

        <Text
          style={[
            styles.messageText,
            message.isMe &&
              styles.myMessageText,
          ]}
        >
          {message.messageText}
        </Text>

        <Text
          style={[
            styles.messageTime,
            message.isMe &&
              styles.myMessageTime,
          ]}
        >
          {formatMessageTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

function ChatEmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="chatbubbles-outline"
          size={32}
          color={light.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        Start the conversation
      </Text>

      <Text style={styles.emptyText}>
        Be the first member to send a message to
        this community.
      </Text>
    </View>
  );
}

function TabEmptyState({
  tab,
  joined,
}: {
  tab: Tab;
  joined: boolean;
}) {
  const content = {
    Chat: {
      icon: 'chatbubbles-outline' as const,
      title: 'Community chat',
      joinedText:
        'No messages have been sent yet.',
      guestText:
        'Join this community to see and participate in its group chat.',
    },
    Events: {
      icon: 'calendar-outline' as const,
      title: 'Community events',
      joinedText:
        'No events have been posted in this community yet.',
      guestText:
        'Join this community to follow its upcoming events.',
    },
    Jobs: {
      icon: 'briefcase-outline' as const,
      title: 'Local opportunities',
      joinedText:
        'No jobs or opportunities have been posted yet.',
      guestText:
        'Join this community to see local jobs and opportunities.',
    },
    Marketplace: {
      icon: 'pricetag-outline' as const,
      title: 'Community marketplace',
      joinedText:
        'No community listings have been posted yet.',
      guestText:
        'Join this community to view its local marketplace listings.',
    },
  }[tab];

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={content.icon}
          size={32}
          color={light.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {content.title}
      </Text>

      <Text style={styles.emptyText}>
        {joined
          ? content.joinedText
          : content.guestText}
      </Text>
    </View>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Please try again.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: light.offWhite,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 12,
  },
  errorHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  errorTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
    marginTop: 14,
  },
  errorText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: light.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 18,
  },
  retryButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  banner: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  adminBadgeText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.offWhite,
  },
  infoBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContent: {
    flex: 1,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
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
    marginTop: 8,
    lineHeight: 17,
  },
  compactJoinButton: {
    minWidth: 70,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.primary,
  },
  compactJoinedButton: {
    backgroundColor: light.card,
    borderWidth: 1.5,
    borderColor: light.border,
  },
  compactJoinText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  compactJoinedText: {
    color: light.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    paddingBottom: 9,
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  tabLabelActive: {
    color: light.primary,
    fontFamily: fontFamily.semibold,
  },
  tabIndicator: {
    marginTop: 6,
    height: 3,
    width: '75%',
    borderRadius: 2,
    backgroundColor: light.primary,
  },
  chatArea: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingRight: 48,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
    paddingRight: 0,
    paddingLeft: 48,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 6,
  },
  otherMessageBubble: {
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderBottomLeftRadius: 4,
  },
  myMessageBubble: {
    backgroundColor: light.primary,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.primary,
    marginBottom: 3,
  },
  messageText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.charcoal,
    lineHeight: 19,
  },
  myMessageText: {
    color: light.offWhite,
  },
  messageTime: {
    alignSelf: 'flex-end',
    fontFamily: fontFamily.secondary,
    fontSize: 10,
    color: light.textSecondary,
    marginTop: 3,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.70)',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: light.border,
    backgroundColor: light.offWhite,
  },
  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 10,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.primary,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  tabContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
    marginTop: 14,
  },
  emptyText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
});
