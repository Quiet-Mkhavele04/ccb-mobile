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
  CommunityEvent,
  CommunityJob,
  CommunityListing,
  CommunityMessage,
  deleteCommunityEvent,
  deleteCommunityJob,
  deleteCommunityListing,
  getCommunity,
  getCommunityEvents,
  getCommunityJobs,
  getCommunityListings,
  getCommunityMessages,
  joinCommunity,
  leaveCommunity,
  sendCommunityMessage,
  updateCommunityListingAvailability,
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

  const [events, setEvents] =
    useState<CommunityEvent[]>([]);

  const [jobs, setJobs] =
    useState<CommunityJob[]>([]);

  const [listings, setListings] =
    useState<CommunityListing[]>([]);

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

  const [deletingEventId, setDeletingEventId] =
    useState<number | null>(null);

  const [deletingJobId, setDeletingJobId] =
    useState<number | null>(null);

  const [changingListingId, setChangingListingId] =
    useState<number | null>(null);

  const [deletingListingId, setDeletingListingId] =
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
        const communityResponse =
          await getCommunity(communityId);

        const nextCommunity =
          communityResponse.community;

        setCommunity(nextCommunity);

        if (nextCommunity.joined) {
          const [
            messagesResponse,
            eventsResponse,
            jobsResponse,
            listingsResponse,
          ] = await Promise.all([
            getCommunityMessages(
              communityId
            ),
            getCommunityEvents(
              communityId
            ),
            getCommunityJobs(
              communityId
            ),
            getCommunityListings(
              communityId
            ),
          ]);

          setMessages(
            messagesResponse.messages
          );

          setEvents(
            eventsResponse.events
          );

          setJobs(jobsResponse.jobs);

          setListings(
            listingsResponse.listings
          );
        } else {
          setMessages([]);
          setEvents([]);
          setJobs([]);
          setListings([]);
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

  function confirmDeleteEvent(
    communityEvent: CommunityEvent
  ) {
    if (!community?.isAdmin) {
      return;
    }

    Alert.alert(
      'Delete event?',
      `“${communityEvent.title}” will be permanently removed.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeEvent(
              communityEvent
                .communityEventId
            );
          },
        },
      ]
    );
  }

  async function removeEvent(
    communityEventId: number
  ) {
    if (!community || deletingEventId) {
      return;
    }

    setDeletingEventId(communityEventId);

    try {
      await deleteCommunityEvent(
        community.communityId,
        communityEventId
      );

      setEvents(current =>
        current.filter(
          item =>
            item.communityEventId !==
            communityEventId
        )
      );
    } catch (deleteError) {
      Alert.alert(
        'Could not delete event',
        getErrorMessage(deleteError)
      );
    } finally {
      setDeletingEventId(null);
    }
  }

  function confirmDeleteJob(
    communityJob: CommunityJob
  ) {
    if (!community?.isAdmin) {
      return;
    }

    Alert.alert(
      'Delete opportunity?',
      `“${communityJob.title}” will be permanently removed.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeJob(
              communityJob.communityJobId
            );
          },
        },
      ]
    );
  }

  async function removeJob(
    communityJobId: number
  ) {
    if (!community || deletingJobId) {
      return;
    }

    setDeletingJobId(communityJobId);

    try {
      await deleteCommunityJob(
        community.communityId,
        communityJobId
      );

      setJobs(current =>
        current.filter(
          item =>
            item.communityJobId !==
            communityJobId
        )
      );
    } catch (deleteError) {
      Alert.alert(
        'Could not delete opportunity',
        getErrorMessage(deleteError)
      );
    } finally {
      setDeletingJobId(null);
    }
  }

  async function changeListingAvailability(
    listing: CommunityListing
  ) {
    if (!community || changingListingId) {
      return;
    }

    setChangingListingId(
      listing.communityListingId
    );

    try {
      const response =
        await updateCommunityListingAvailability(
          community.communityId,
          listing.communityListingId,
          !listing.isAvailable
        );

      setListings(current =>
        current.map(item =>
          item.communityListingId ===
          listing.communityListingId
            ? {
                ...item,
                isAvailable:
                  response.isAvailable,
              }
            : item
        )
      );
    } catch (updateError) {
      Alert.alert(
        'Could not update listing',
        getErrorMessage(updateError)
      );
    } finally {
      setChangingListingId(null);
    }
  }

  function confirmDeleteListing(
    listing: CommunityListing
  ) {
    Alert.alert(
      'Delete listing?',
      `“${listing.title}” and its image will be permanently removed.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeListing(
              listing.communityListingId
            );
          },
        },
      ]
    );
  }

  async function removeListing(
    communityListingId: number
  ) {
    if (!community || deletingListingId) {
      return;
    }

    setDeletingListingId(
      communityListingId
    );

    try {
      await deleteCommunityListing(
        community.communityId,
        communityListingId
      );

      setListings(current =>
        current.filter(
          item =>
            item.communityListingId !==
            communityListingId
        )
      );
    } catch (deleteError) {
      Alert.alert(
        'Could not delete listing',
        getErrorMessage(deleteError)
      );
    } finally {
      setDeletingListingId(null);
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
        ) : activeTab === 'Events' ? (
          community.joined ? (
            <EventsTab
              events={events}
              isAdmin={community.isAdmin}
              refreshing={refreshing}
              deletingEventId={
                deletingEventId
              }
              onRefresh={() =>
                void refresh()
              }
              onCreate={() =>
                navigation.navigate(
                  'CreateCommunityEvent',
                  {
                    communityId:
                      community.communityId,
                    communityName:
                      community.name,
                  }
                )
              }
              onDelete={confirmDeleteEvent}
            />
          ) : (
            <ScrollView
              contentContainerStyle={
                styles.tabContent
              }
            >
              <TabEmptyState
                tab="Events"
                joined={false}
              />
            </ScrollView>
          )
        ) : activeTab === 'Jobs' ? (
          community.joined ? (
            <JobsTab
              jobs={jobs}
              isAdmin={community.isAdmin}
              refreshing={refreshing}
              deletingJobId={deletingJobId}
              onRefresh={() =>
                void refresh()
              }
              onCreate={() =>
                navigation.navigate(
                  'CreateCommunityJob',
                  {
                    communityId:
                      community.communityId,
                    communityName:
                      community.name,
                  }
                )
              }
              onDelete={confirmDeleteJob}
            />
          ) : (
            <ScrollView
              contentContainerStyle={
                styles.tabContent
              }
            >
              <TabEmptyState
                tab="Jobs"
                joined={false}
              />
            </ScrollView>
          )
        ) : community.joined ? (
          <MarketplaceTab
            listings={listings}
            isAdmin={community.isAdmin}
            refreshing={refreshing}
            changingListingId={
              changingListingId
            }
            deletingListingId={
              deletingListingId
            }
            onRefresh={() =>
              void refresh()
            }
            onCreate={() =>
              navigation.navigate(
                'CreateCommunityListing',
                {
                  communityId:
                    community.communityId,
                  communityName:
                    community.name,
                }
              )
            }
            onToggleAvailability={listing =>
              void changeListingAvailability(
                listing
              )
            }
            onDelete={confirmDeleteListing}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.tabContent}
          >
            <TabEmptyState
              tab="Marketplace"
              joined={false}
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

function EventsTab({
  events,
  isAdmin,
  refreshing,
  deletingEventId,
  onRefresh,
  onCreate,
  onDelete,
}: {
  events: CommunityEvent[];
  isAdmin: boolean;
  refreshing: boolean;
  deletingEventId: number | null;
  onRefresh: () => void;
  onCreate: () => void;
  onDelete: (
    communityEvent: CommunityEvent
  ) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={
        styles.eventsContent
      }
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={light.primary}
          colors={[light.primary]}
        />
      }
    >
      <View style={styles.eventsHeader}>
        <View style={styles.eventsHeaderText}>
          <Text style={styles.eventsTitle}>
            Upcoming events
          </Text>

          <Text style={styles.eventsSubtitle}>
            Connect with your community in person
            and online.
          </Text>
        </View>

        {isAdmin && (
          <Pressable
            style={styles.addEventButton}
            onPress={onCreate}
          >
            <Ionicons
              name="add"
              size={20}
              color={light.offWhite}
            />

            <Text style={styles.addEventText}>
              Create
            </Text>
          </Pressable>
        )}
      </View>

      {events.length === 0 ? (
        <TabEmptyState
          tab="Events"
          joined
        />
      ) : (
        events.map(communityEvent => (
          <EventCard
            key={
              communityEvent.communityEventId
            }
            communityEvent={communityEvent}
            isAdmin={isAdmin}
            deleting={
              deletingEventId ===
              communityEvent.communityEventId
            }
            onDelete={() =>
              onDelete(communityEvent)
            }
          />
        ))
      )}
    </ScrollView>
  );
}

function EventCard({
  communityEvent,
  isAdmin,
  deleting,
  onDelete,
}: {
  communityEvent: CommunityEvent;
  isAdmin: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const dateParts = formatEventDate(
    communityEvent.eventDate,
    communityEvent.dateLabel
  );

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventDateBox}>
        <Text style={styles.eventMonth}>
          {dateParts.month}
        </Text>

        <Text style={styles.eventDay}>
          {dateParts.day}
        </Text>
      </View>

      <View style={styles.eventInformation}>
        <View style={styles.eventTitleRow}>
          <Text
            style={styles.eventTitle}
            numberOfLines={2}
          >
            {communityEvent.title}
          </Text>

          {isAdmin && (
            <Pressable
              style={styles.deleteEventButton}
              disabled={deleting}
              onPress={onDelete}
              hitSlop={8}
            >
              {deleting ? (
                <ActivityIndicator
                  size="small"
                  color={light.danger}
                />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={light.danger}
                />
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.eventMetaRow}>
          <Ionicons
            name="time-outline"
            size={15}
            color={light.primary}
          />

          <Text style={styles.eventMetaText}>
            {dateParts.full}
          </Text>
        </View>

        {communityEvent.location && (
          <View style={styles.eventMetaRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={light.primary}
            />

            <Text
              style={styles.eventMetaText}
              numberOfLines={2}
            >
              {communityEvent.location}
            </Text>
          </View>
        )}

        {communityEvent.description && (
          <Text
            style={styles.eventDescription}
            numberOfLines={3}
          >
            {communityEvent.description}
          </Text>
        )}
      </View>
    </View>
  );
}

function JobsTab({
  jobs,
  isAdmin,
  refreshing,
  deletingJobId,
  onRefresh,
  onCreate,
  onDelete,
}: {
  jobs: CommunityJob[];
  isAdmin: boolean;
  refreshing: boolean;
  deletingJobId: number | null;
  onRefresh: () => void;
  onCreate: () => void;
  onDelete: (job: CommunityJob) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.jobsContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={light.primary}
          colors={[light.primary]}
        />
      }
    >
      <View style={styles.jobsHeader}>
        <View style={styles.jobsHeaderText}>
          <Text style={styles.jobsTitle}>
            Local opportunities
          </Text>

          <Text style={styles.jobsSubtitle}>
            Jobs, internships and projects shared
            with community members.
          </Text>
        </View>

        {isAdmin && (
          <Pressable
            style={styles.addJobButton}
            onPress={onCreate}
          >
            <Ionicons
              name="add"
              size={20}
              color={light.offWhite}
            />

            <Text style={styles.addJobText}>
              Post
            </Text>
          </Pressable>
        )}
      </View>

      {jobs.length === 0 ? (
        <TabEmptyState tab="Jobs" joined />
      ) : (
        jobs.map(job => (
          <JobCard
            key={job.communityJobId}
            job={job}
            isAdmin={isAdmin}
            deleting={
              deletingJobId ===
              job.communityJobId
            }
            onDelete={() => onDelete(job)}
          />
        ))
      )}
    </ScrollView>
  );
}

function JobCard({
  job,
  isAdmin,
  deleting,
  onDelete,
}: {
  job: CommunityJob;
  isAdmin: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobIcon}>
        <Ionicons
          name="briefcase-outline"
          size={24}
          color={light.primary}
        />
      </View>

      <View style={styles.jobInformation}>
        <View style={styles.jobTitleRow}>
          <Text
            style={styles.jobTitle}
            numberOfLines={2}
          >
            {job.title}
          </Text>

          {isAdmin && (
            <Pressable
              style={styles.deleteJobButton}
              disabled={deleting}
              onPress={onDelete}
              hitSlop={8}
            >
              {deleting ? (
                <ActivityIndicator
                  size="small"
                  color={light.danger}
                />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={light.danger}
                />
              )}
            </Pressable>
          )}
        </View>

        {job.company && (
          <Text style={styles.jobCompany}>
            {job.company}
          </Text>
        )}

        <View style={styles.jobTags}>
          {job.employmentType && (
            <View style={styles.jobTag}>
              <Text style={styles.jobTagText}>
                {job.employmentType}
              </Text>
            </View>
          )}

          {job.location && (
            <View style={styles.jobMetaRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={light.textSecondary}
              />

              <Text
                style={styles.jobMetaText}
                numberOfLines={1}
              >
                {job.location}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={styles.jobDetail}
          numberOfLines={4}
        >
          {job.detail}
        </Text>

        {job.applicationContact && (
          <View style={styles.applicationBox}>
            <Ionicons
              name="paper-plane-outline"
              size={15}
              color={light.primary}
            />

            <Text
              style={styles.applicationText}
              selectable
            >
              {job.applicationContact}
            </Text>
          </View>
        )}

        <View style={styles.jobFooter}>
          <Text style={styles.jobPostedText}>
            Posted {formatShortDate(job.postedAt)}
            {job.postedByName
              ? ` by ${job.postedByName}`
              : ''}
          </Text>

          {job.expiresAt && (
            <Text style={styles.jobClosingText}>
              Closes {formatShortDate(job.expiresAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function MarketplaceTab({
  listings,
  isAdmin,
  refreshing,
  changingListingId,
  deletingListingId,
  onRefresh,
  onCreate,
  onToggleAvailability,
  onDelete,
}: {
  listings: CommunityListing[];
  isAdmin: boolean;
  refreshing: boolean;
  changingListingId: number | null;
  deletingListingId: number | null;
  onRefresh: () => void;
  onCreate: () => void;
  onToggleAvailability: (
    listing: CommunityListing
  ) => void;
  onDelete: (
    listing: CommunityListing
  ) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={
        styles.marketplaceContent
      }
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={light.primary}
          colors={[light.primary]}
        />
      }
    >
      <View style={styles.marketplaceHeader}>
        <View style={styles.marketplaceHeaderText}>
          <Text style={styles.marketplaceTitle}>
            Community marketplace
          </Text>

          <Text style={styles.marketplaceSubtitle}>
            Buy and sell items safely with local
            community members.
          </Text>
        </View>

        <Pressable
          style={styles.addListingButton}
          onPress={onCreate}
        >
          <Ionicons
            name="add"
            size={20}
            color={light.offWhite}
          />

          <Text style={styles.addListingText}>
            Sell
          </Text>
        </Pressable>
      </View>

      {listings.length === 0 ? (
        <TabEmptyState
          tab="Marketplace"
          joined
        />
      ) : (
        listings.map(listing => (
          <MarketplaceCard
            key={
              listing.communityListingId
            }
            listing={listing}
            canManage={
              listing.isMine || isAdmin
            }
            changing={
              changingListingId ===
              listing.communityListingId
            }
            deleting={
              deletingListingId ===
              listing.communityListingId
            }
            onToggleAvailability={() =>
              onToggleAvailability(listing)
            }
            onDelete={() =>
              onDelete(listing)
            }
          />
        ))
      )}
    </ScrollView>
  );
}

function MarketplaceCard({
  listing,
  canManage,
  changing,
  deleting,
  onToggleAvailability,
  onDelete,
}: {
  listing: CommunityListing;
  canManage: boolean;
  changing: boolean;
  deleting: boolean;
  onToggleAvailability: () => void;
  onDelete: () => void;
}) {
  const busy = changing || deleting;

  return (
    <View
      style={[
        styles.listingCard,
        !listing.isAvailable &&
          styles.soldListingCard,
      ]}
    >
      <View style={styles.listingImageArea}>
        {listing.imageUrl ? (
          <Image
            source={{ uri: listing.imageUrl }}
            style={styles.listingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.listingImageFallback}>
            <Ionicons
              name="image-outline"
              size={36}
              color={light.primary}
            />
          </View>
        )}

        {!listing.isAvailable && (
          <View style={styles.soldOverlay}>
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>
                SOLD
              </Text>
            </View>
          </View>
        )}

        {listing.isMine && (
          <View style={styles.myListingBadge}>
            <Text style={styles.myListingBadgeText}>
              Your listing
            </Text>
          </View>
        )}
      </View>

      <View style={styles.listingBody}>
        <View style={styles.listingTitleRow}>
          <Text
            style={styles.listingTitle}
            numberOfLines={2}
          >
            {listing.title}
          </Text>

          <Text style={styles.listingPrice}>
            {formatListingPrice(
              listing.price
            )}
          </Text>
        </View>

        <View style={styles.listingTags}>
          {listing.category && (
            <View style={styles.listingTag}>
              <Text style={styles.listingTagText}>
                {listing.category}
              </Text>
            </View>
          )}

          {listing.condition && (
            <View
              style={styles.listingConditionTag}
            >
              <Text
                style={
                  styles.listingConditionText
                }
              >
                {listing.condition}
              </Text>
            </View>
          )}
        </View>

        {listing.description && (
          <Text
            style={styles.listingDescription}
            numberOfLines={4}
          >
            {listing.description}
          </Text>
        )}

        {listing.location && (
          <View style={styles.listingMetaRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={light.textSecondary}
            />

            <Text
              style={styles.listingMetaText}
              numberOfLines={2}
            >
              {listing.location}
            </Text>
          </View>
        )}

        <View style={styles.sellerRow}>
          <View style={styles.sellerIcon}>
            <Ionicons
              name="person-outline"
              size={15}
              color={light.primary}
            />
          </View>

          <View style={styles.sellerDetails}>
            <Text style={styles.sellerLabel}>
              Seller
            </Text>

            <Text style={styles.sellerName}>
              {listing.sellerName ||
                'Community member'}
            </Text>
          </View>

          <Text style={styles.listingDate}>
            {formatShortDate(
              listing.createdAt
            )}
          </Text>
        </View>

        {listing.contact && (
          <View style={styles.contactBox}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={light.primary}
            />

            <Text
              style={styles.contactText}
              selectable
            >
              {listing.contact}
            </Text>
          </View>
        )}

        {canManage && (
          <View style={styles.listingActions}>
            <Pressable
              style={[
                styles.availabilityButton,
                listing.isAvailable
                  ? styles.markSoldButton
                  : styles.markAvailableButton,
                busy && styles.disabledButton,
              ]}
              disabled={busy}
              onPress={onToggleAvailability}
            >
              {changing ? (
                <ActivityIndicator
                  size="small"
                  color={
                    listing.isAvailable
                      ? light.charcoal
                      : light.primary
                  }
                />
              ) : (
                <>
                  <Ionicons
                    name={
                      listing.isAvailable
                        ? 'checkmark-circle-outline'
                        : 'refresh-outline'
                    }
                    size={18}
                    color={
                      listing.isAvailable
                        ? light.charcoal
                        : light.primary
                    }
                  />

                  <Text
                    style={[
                      styles.availabilityText,
                      !listing.isAvailable &&
                        styles.availableText,
                    ]}
                  >
                    {listing.isAvailable
                      ? 'Mark sold'
                      : 'Mark available'}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.deleteListingButton,
                busy && styles.disabledButton,
              ]}
              disabled={busy}
              onPress={onDelete}
            >
              {deleting ? (
                <ActivityIndicator
                  size="small"
                  color={light.danger}
                />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={light.danger}
                />
              )}
            </Pressable>
          </View>
        )}
      </View>
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

function formatEventDate(
  value: string | null,
  fallback: string | null
) {
  if (!value) {
    return {
      month: 'TBA',
      day: '—',
      full: fallback || 'Date to be announced',
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      month: 'TBA',
      day: '—',
      full: fallback || 'Date to be announced',
    };
  }

  return {
    month: date
      .toLocaleDateString([], {
        month: 'short',
      })
      .toUpperCase(),
    day: date.toLocaleDateString([], {
      day: '2-digit',
    }),
    full: date.toLocaleString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatListingPrice(
  value: number | null
) {
  if (value === null) {
    return 'Contact for price';
  }

  return `R${value.toLocaleString(
    'en-ZA',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
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
  eventsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  eventsHeaderText: {
    flex: 1,
  },
  eventsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  eventsSubtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: light.primary,
  },
  addEventText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 16,
    backgroundColor: light.card,
    marginBottom: 12,
  },
  eventDateBox: {
    width: 54,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#EAF3EF',
  },
  eventMonth: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    color: light.primary,
  },
  eventDay: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: light.charcoal,
    marginTop: 1,
  },
  eventInformation: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventTitle: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    lineHeight: 19,
  },
  deleteEventButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -5,
    marginRight: -5,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 7,
  },
  eventMetaText: {
    flex: 1,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 16,
  },
  eventDescription: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 17,
    marginTop: 9,
  },
  jobsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  jobsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  jobsHeaderText: {
    flex: 1,
  },
  jobsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  jobsSubtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  addJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: light.primary,
  },
  addJobText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 16,
    backgroundColor: light.card,
    marginBottom: 12,
  },
  jobIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EF',
  },
  jobInformation: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobTitle: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    lineHeight: 19,
  },
  deleteJobButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -5,
    marginRight: -5,
  },
  jobCompany: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.primary,
    marginTop: 3,
  },
  jobTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  jobTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EAF3EF',
  },
  jobTagText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: light.primary,
  },
  jobMetaRow: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  jobMetaText: {
    flex: 1,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
  },
  jobDetail: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 17,
    marginTop: 9,
  },
  applicationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 9,
    borderRadius: 10,
    backgroundColor: '#F4F8F6',
    marginTop: 10,
  },
  applicationText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.primary,
  },
  jobFooter: {
    marginTop: 10,
    gap: 2,
  },
  jobPostedText: {
    fontFamily: fontFamily.secondary,
    fontSize: 10,
    color: light.textSecondary,
  },
  jobClosingText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: light.danger,
  },
  marketplaceContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  marketplaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  marketplaceHeaderText: {
    flex: 1,
  },
  marketplaceTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },
  marketplaceSubtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  addListingButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: light.primary,
  },
  addListingText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    color: light.offWhite,
  },
  listingCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 17,
    backgroundColor: light.card,
    marginBottom: 16,
  },
  soldListingCard: {
    opacity: 0.82,
  },
  listingImageArea: {
    height: 190,
    backgroundColor: '#EAF3EF',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  soldBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: light.card,
  },
  soldBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: light.charcoal,
    letterSpacing: 1,
  },
  myListingBadge: {
    position: 'absolute',
    top: 11,
    left: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: light.primary,
  },
  myListingBadgeText: {
    fontFamily: fontFamily.semibold,
    fontSize: 10,
    color: light.offWhite,
  },
  listingBody: {
    padding: 14,
  },
  listingTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listingTitle: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
    lineHeight: 21,
  },
  listingPrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: light.primary,
  },
  listingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 9,
  },
  listingTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EAF3EF',
  },
  listingTagText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: light.primary,
  },
  listingConditionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFF6E6',
  },
  listingConditionText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: light.charcoal,
  },
  listingDescription: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 17,
    marginTop: 10,
  },
  listingMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 10,
  },
  listingMetaText: {
    flex: 1,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.textSecondary,
    lineHeight: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  sellerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EF',
  },
  sellerDetails: {
    flex: 1,
    marginLeft: 8,
  },
  sellerLabel: {
    fontFamily: fontFamily.secondary,
    fontSize: 10,
    color: light.textSecondary,
  },
  sellerName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.charcoal,
    marginTop: 1,
  },
  listingDate: {
    fontFamily: fontFamily.secondary,
    fontSize: 10,
    color: light.textSecondary,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 11,
    backgroundColor: '#F4F8F6',
    marginTop: 11,
  },
  contactText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: light.primary,
  },
  listingActions: {
    flexDirection: 'row',
    gap: 9,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: light.border,
  },
  availabilityButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  markSoldButton: {
    borderColor: '#E1C98C',
    backgroundColor: '#FFF6E6',
  },
  markAvailableButton: {
    borderColor: light.primary,
    backgroundColor: '#EAF3EF',
  },
  availabilityText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.charcoal,
  },
  availableText: {
    color: light.primary,
  },
  deleteListingButton: {
    width: 44,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1C8C8',
    borderRadius: 12,
    backgroundColor: '#FFF3F3',
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
