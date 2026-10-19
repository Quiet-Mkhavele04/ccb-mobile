import React, {

  useCallback,

  useRef,

  useState,

} from 'react';



import {

  ActivityIndicator,

  Alert,

  FlatList,

  KeyboardAvoidingView,

  Platform,

  Pressable,

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



import Avatar from '../../components/Avatar';



import { light } from '../../theme/colors';



import {

  fontFamily,

  fontSize,

} from '../../theme/fonts';



import {

  deleteMessage as deleteMessageApi,

  editMessage as editMessageApi,

  getConversation,

  sendMessage as sendMessageApi,

} from '../../api/messagesApi';



import type {

  ChatMessage,

} from '../../api/messagesApi';



import {

  translateMessage,

} from '../../api/translationsApi';



import {

  getChatConnection,

  startChatConnection,

} from '../../api/chatHub';



import type {

  RootStackParamList,

} from '../../navigation/RootNavigator';



type ChatMessageWithReadState =

  ChatMessage & {

    readAt?: string | null;

  };



type RealtimeChatMessage =

  ChatMessage & {

    contactId: number;

  };



type ChatRouteProp =

  RouteProp<

    RootStackParamList,

    'Chat'

  >;



type ChatNavProp =

  NativeStackNavigationProp<

    RootStackParamList,

    'Chat'

  >;



function formatMessageTime(

  dateValue: string

) {

  const date = new Date(dateValue);



  if (Number.isNaN(date.getTime())) {

    return '';

  }



  return date.toLocaleTimeString(

    [],

    {

      hour: '2-digit',

      minute: '2-digit',

    }

  );

}



export default function ChatScreen() {

  const navigation =

    useNavigation<ChatNavProp>();



  const route =

    useRoute<ChatRouteProp>();



  const {
    contactId,
    name,
    avatarColor,
    photoUrl,
    isOnline,
  } = route.params;



  const listRef =

    useRef<FlatList<ChatMessage>>(

      null

    );



  const otherProfileIdRef =

    useRef<number | null>(null);



  const [messages, setMessages] =

    useState<ChatMessage[]>([]);



  const [draft, setDraft] =

    useState('');



  const [loading, setLoading] =

    useState(true);



  const [sending, setSending] =

    useState(false);



  const [editingMessage, setEditingMessage] =

    useState<ChatMessage | null>(null);



  const [error, setError] =

    useState('');



  const [translatedMessages, setTranslatedMessages] =

    useState<Map<number, string>>(new Map());



  const [translatingIds, setTranslatingIds] =

    useState<Set<number>>(new Set());



  const loadMessages =

    useCallback(

      async (

        showLoading = true

      ) => {

        try {

          if (showLoading) {

            setLoading(true);

          }



          setError('');



          const result =

            await getConversation(

              contactId

            );



          otherProfileIdRef.current =

            result.contact.profileId;



          setMessages(

            currentMessages => {

              const currentSignature =

                currentMessages

                  .map(message => {

                    const readAt =

                      (message as ChatMessageWithReadState)

                        .readAt ?? '';



                    return `${message.messageId}:${message.editedAt}:${readAt}`;

                  })

                  .join('|');



              const newSignature =

                result.messages

                  .map(message => {

                    const readAt =

                      (message as ChatMessageWithReadState)

                        .readAt ?? '';



                    return `${message.messageId}:${message.editedAt}:${readAt}`;

                  })

                  .join('|');



              if (

                currentSignature ===

                newSignature

              ) {

                return currentMessages;

              }



              console.log(

                'Conversation refreshed:',

                result.messages

              );



              return result.messages;

            }

          );

        } catch (requestError) {

          console.error(

            'Unable to load conversation:',

            requestError

          );



          if (showLoading) {

            setError(

              requestError instanceof Error

                ? requestError.message

                : 'Unable to load the conversation.'

            );

          }

        } finally {

          if (showLoading) {

            setLoading(false);

          }

        }

      },

      [contactId]

    );



  useFocusEffect(

    useCallback(() => {

      let screenIsActive = true;



      void loadMessages(true);



      const connection =

        getChatConnection();



      const handleMessageReceived = (

        incomingMessage: RealtimeChatMessage

      ) => {

        const otherProfileId =

          otherProfileIdRef.current;



        if (

          !screenIsActive ||

          otherProfileId == null ||

          (

            incomingMessage.senderProfileId !==

              otherProfileId &&

            incomingMessage.recipientProfileId !==

              otherProfileId

          )

        ) {

          return;

        }



        setMessages(previous => {

          const existingMessage =

            previous.some(

              message =>

                message.messageId ===

                incomingMessage.messageId

            );



          if (existingMessage) {

            return previous.map(message =>

              message.messageId ===

              incomingMessage.messageId

                ? incomingMessage

                : message

            );

          }



          return [

            ...previous,

            incomingMessage,

          ];

        });



        setTimeout(() => {

          listRef.current?.scrollToEnd({

            animated: true,

          });

        }, 100);

      };



      connection.on(

        'MessageReceived',

        handleMessageReceived

      );



      void startChatConnection().catch(

        connectionError => {

          console.error(

            'Unable to start real-time chat:',

            connectionError

          );

        }

      );



      // A slower fallback refresh covers temporary

      // SignalR disconnections.

      const refreshTimer =

        setInterval(() => {

          void loadMessages(false);

        }, 15000);



      return () => {

        screenIsActive = false;



        clearInterval(

          refreshTimer

        );



        connection.off(

          'MessageReceived',

          handleMessageReceived

        );

      };

    }, [contactId, loadMessages])

  );



  const handleSend =

    useCallback(async () => {

      const trimmed =

        draft.trim();



      if (!trimmed || sending) {

        return;

      }



      try {

        setSending(true);



        if (editingMessage) {

          const result = await editMessageApi(

            editingMessage.messageId,

            trimmed

          );



          setMessages(previous =>

            previous.map(message =>

              message.messageId ===

              editingMessage.messageId

                ? result.data

                : message

            )

          );



          setDraft('');

          setEditingMessage(null);

          return;

        }



        const result =

          await sendMessageApi(

            contactId,

            trimmed

          );



        console.log(

          'Message sent:',

          result

        );



        setMessages(previous => {

          const alreadyAdded =

            previous.some(

              message =>

                message.messageId ===

                result.data.messageId

            );



          return alreadyAdded

            ? previous

            : [

                ...previous,

                result.data,

              ];

        });



        setDraft('');



        setTimeout(() => {

          listRef.current?.scrollToEnd({

            animated: true,

          });

        }, 100);

      } catch (requestError) {

        console.error(

          'Unable to send message:',

          requestError

        );



        Alert.alert(

          'Message not sent',

          requestError instanceof Error

            ? requestError.message

            : 'Unable to send the message.'

        );

      } finally {

        setSending(false);

      }

    }, [

      contactId,

      draft,

      editingMessage,

      sending,

    ]);



  const cancelEditing =

    useCallback(() => {

      setEditingMessage(null);

      setDraft('');

    }, []);



  const confirmDeleteMessage =

    useCallback(

      (message: ChatMessage) => {

        Alert.alert(

          'Delete message',

          'Delete this message for everyone?',

          [

            {

              text: 'Cancel',

              style: 'cancel',

            },

            {

              text: 'Delete',

              style: 'destructive',

              onPress: () => {

                void (async () => {

                  try {

                    await deleteMessageApi(

                      message.messageId

                    );



                    setMessages(previous =>

                      previous.filter(

                        currentMessage =>

                          currentMessage.messageId !==

                          message.messageId

                      )

                    );



                    if (

                      editingMessage?.messageId ===

                      message.messageId

                    ) {

                      cancelEditing();

                    }

                  } catch (requestError) {

                    Alert.alert(

                      'Message not deleted',

                      requestError instanceof Error

                        ? requestError.message

                        : 'Unable to delete the message.'

                    );

                  }

                })();

              },

            },

          ]

        );

      },

      [cancelEditing, editingMessage]

    );



  const openMessageActions =

    useCallback(

      (message: ChatMessage) => {

        if (!message.isMine) {

          return;

        }



        Alert.alert(

          'Message options',

          'What would you like to do?',

          [

            {

              text: 'Edit message',

              onPress: () => {

                setEditingMessage(message);

                setDraft(message.messageText);

              },

            },

            {

              text: 'Delete message',

              style: 'destructive',

              onPress: () =>

                confirmDeleteMessage(message),

            },

            {

              text: 'Cancel',

              style: 'cancel',

            },

          ]

        );

      },

      [confirmDeleteMessage]

    );



  const toggleTranslation =

    useCallback(

      async (message: ChatMessage) => {

        if (

          translatedMessages.has(

            message.messageId

          )

        ) {

          setTranslatedMessages(previous => {

            const next = new Map(previous);

            next.delete(message.messageId);

            return next;

          });



          return;

        }



        if (

          translatingIds.has(message.messageId)

        ) {

          return;

        }



        try {

          setTranslatingIds(previous => {

            const next = new Set(previous);

            next.add(message.messageId);

            return next;

          });



          const result = await translateMessage(

            message.messageId

          );



          setTranslatedMessages(previous => {

            const next = new Map(previous);



            next.set(

              message.messageId,

              result.data.translatedText ??

                message.messageText

            );



            return next;

          });

        } catch (requestError) {

          Alert.alert(

            'Translation unavailable',

            requestError instanceof Error

              ? requestError.message

              : 'Unable to translate the message.'

          );

        } finally {

          setTranslatingIds(previous => {

            const next = new Set(previous);

            next.delete(message.messageId);

            return next;

          });

        }

      },

      [translatedMessages, translatingIds]

    );



  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
      keyboardVerticalOffset={0}
      enabled
    >

      <SafeAreaView

        style={styles.container}

        edges={['top']}

      >

        {/* Header */}

        <View style={styles.header}>

          <Pressable

            onPress={() =>

              navigation.goBack()

            }

            hitSlop={12}

          >

            <Ionicons

              name="chevron-back"

              size={24}

              color={light.charcoal}

            />

          </Pressable>



          <View

            style={styles.headerCenter}

          >

            <Avatar
              name={name}
              color={avatarColor}
              photoUrl={photoUrl}
              size={38}
              online={isOnline}
            />



            <View

              style={

                styles.headerTextBlock

              }

            >

              <Text

                style={styles.headerName}

                numberOfLines={1}

              >

                {name}

              </Text>



              <Text

                style={[

                  styles.headerStatus,

                  !isOnline &&

                    styles.headerStatusOffline,

                ]}

              >

                {isOnline

                  ? 'Online'

                  : 'Last seen recently'}

              </Text>

            </View>

          </View>



          <View

            style={styles.headerActions}

          >

            <Pressable

              hitSlop={10}

              style={

                styles.firstHeaderAction

              }

            >

              <Ionicons

                name="call"

                size={20}

                color={light.primary}

              />

            </Pressable>



            <Pressable hitSlop={10}>

              <Ionicons

                name="videocam"

                size={22}

                color={light.primary}

              />

            </Pressable>

          </View>

        </View>



        {/* Loading */}

        {loading && (

          <View style={styles.centerState}>

            <ActivityIndicator

              size="large"

              color={light.primary}

            />



            <Text

              style={styles.stateText}

            >

              Loading messages...

            </Text>

          </View>

        )}



        {/* Error */}

        {!loading &&

          error.length > 0 && (

            <View

              style={styles.centerState}

            >

              <Ionicons

                name="cloud-offline-outline"

                size={42}

                color={light.danger}

              />



              <Text

                style={styles.errorText}

              >

                {error}

              </Text>



              <Pressable

                style={styles.retryButton}

                onPress={() => {

                  void loadMessages();

                }}

              >

                <Text

                  style={

                    styles.retryButtonText

                  }

                >

                  Try again

                </Text>

              </Pressable>

            </View>

          )}



        {/* Message thread */}

        {!loading &&

          error.length === 0 && (

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item =>
                String(item.messageId)
              }
              contentContainerStyle={
                styles.thread
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios'
                  ? 'interactive'
                  : 'on-drag'
              }
              renderItem={({ item }) => {

                const isSent =

                  item.isMine;



                const isRead = Boolean(

                  (

                    item as ChatMessageWithReadState

                  ).readAt

                );



                const displayText =

                  translatedMessages.get(

                    item.messageId

                  ) ?? item.messageText;



                const isTranslating =

                  translatingIds.has(

                    item.messageId

                  );



                return (

                  <View

                    style={[

                      styles.bubbleRow,

                      isSent

                        ? styles.bubbleRowSent

                        : styles.bubbleRowReceived,

                    ]}

                  >

                    {isSent && (

                      <Pressable

                        style={styles.messageOptionsButton}

                        onPress={() =>

                          openMessageActions(item)

                        }

                        hitSlop={10}

                      >

                        <Ionicons

                          name="ellipsis-horizontal"

                          size={19}

                          color={light.textSecondary}

                        />

                      </Pressable>

                    )}



                    <Pressable

                      style={[

                        styles.bubble,

                        isSent

                          ? styles.bubbleSent

                          : styles.bubbleReceived,

                      ]}

                      onLongPress={() =>

                        openMessageActions(item)

                      }

                      delayLongPress={350}

                      disabled={!isSent}

                    >

                      <Text

                        style={[

                          styles.bubbleText,

                          isSent &&

                            styles.bubbleTextSent,

                        ]}

                      >

                        {displayText}

                      </Text>



                      <View

                        style={

                          styles.bubbleFooter

                        }

                      >

                        {item.editedAt && (

                          <Text

                            style={[

                              styles.editedText,

                              isSent &&

                                styles.editedTextSent,

                            ]}

                          >

                            Edited

                          </Text>

                        )}



                        <Text

                          style={[

                            styles.bubbleTime,

                            isSent &&

                              styles.bubbleTimeSent,

                          ]}

                        >

                          {formatMessageTime(

                            item.sentAt

                          )}

                        </Text>



                        <Pressable

                          onPress={() =>

                            void toggleTranslation(item)

                          }

                          hitSlop={8}

                          disabled={isTranslating}

                        >

                          {isTranslating ? (

                            <ActivityIndicator

                              size="small"

                              color={

                                isSent

                                  ? light.offWhite

                                  : light.primary

                              }

                              style={styles.translationIcon}

                            />

                          ) : (

                            <Ionicons

                              name="language"

                              size={14}

                              color={

                                isSent

                                  ? 'rgba(248,246,242,0.8)'

                                  : light.primary

                              }

                              style={styles.translationIcon}

                            />

                          )}

                        </Pressable>



                        {isSent && (

                          <Text

                            style={styles.seenEmoji}

                            accessibilityLabel={

                              isRead

                                ? 'Message seen'

                                : 'Message not seen'

                            }

                          >

                            {isRead ? '👀' : '😌'}

                          </Text>

                        )}

                      </View>

                    </Pressable>

                  </View>

                );

              }}

              ListEmptyComponent={

                <View

                  style={styles.emptyState}

                >

                  <Text

                    style={styles.emptyText}

                  >

                    Say hello to{' '}

                    {name.split(' ')[0]} 👋

                  </Text>

                </View>

              }

              onContentSizeChange={() => {

                if (

                  messages.length > 0

                ) {

                  listRef.current

                    ?.scrollToEnd({

                      animated: false,

                    });

                }

              }}

              showsVerticalScrollIndicator={

                false

              }

            />

          )}



        {/* Editing notice */}

        {editingMessage && (

          <View style={styles.editingBar}>

            <View style={styles.editingTextBlock}>

              <Text style={styles.editingTitle}>

                Editing message

              </Text>



              <Text

                style={styles.editingPreview}

                numberOfLines={1}

              >

                {editingMessage.messageText}

              </Text>

            </View>



            <Pressable

              onPress={cancelEditing}

              hitSlop={10}

            >

              <Ionicons

                name="close-circle"

                size={24}

                color={light.textSecondary}

              />

            </Pressable>

          </View>

        )}



        {/* Input */}

        <View style={styles.inputBar}>

          <Pressable

            hitSlop={10}

            style={styles.addButton}

          >

            <Ionicons

              name="add-circle-outline"

              size={26}

              color={

                light.textSecondary

              }

            />

          </Pressable>



          <TextInput

            style={styles.input}

            placeholder={

              editingMessage

                ? 'Edit message...'

                : 'Message...'

            }

            placeholderTextColor={

              light.textSecondary

            }

            value={draft}

            onChangeText={setDraft}

            multiline

            editable={!sending}

          />



          <Pressable

            style={[

              styles.sendButton,

              (!draft.trim() ||

                sending) &&

                styles.sendButtonDisabled,

            ]}

            onPress={() => {

              void handleSend();

            }}

            disabled={

              !draft.trim() ||

              sending

            }

          >

            {sending ? (

              <ActivityIndicator

                size="small"

                color={light.offWhite}

              />

            ) : (

              <Ionicons

                name={

                  editingMessage

                    ? 'checkmark'

                    : 'send'

                }

                size={18}

                color={light.offWhite}

              />

            )}

          </Pressable>

        </View>

      </SafeAreaView>

    </KeyboardAvoidingView>

  );

}



const styles = StyleSheet.create({

  keyboardView: {

    flex: 1,

  },



  container: {

    flex: 1,

    backgroundColor: light.offWhite,

  },



  header: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 16,

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: light.border,

    backgroundColor: light.card,

  },



  headerCenter: {

    flexDirection: 'row',

    alignItems: 'center',

    flex: 1,

    marginLeft: 12,

  },



  headerTextBlock: {

    marginLeft: 10,

  },



  headerName: {

    fontFamily: fontFamily.semibold,

    fontSize: fontSize.md,

    color: light.charcoal,

  },



  headerStatus: {

    fontFamily: fontFamily.secondary,

    fontSize: fontSize.xs,

    color: light.online,

    marginTop: 2,

  },



  headerStatusOffline: {

    color: light.textSecondary,

  },



  headerActions: {

    flexDirection: 'row',

    alignItems: 'center',

  },



  firstHeaderAction: {

    marginRight: 18,

  },



  thread: {

    paddingHorizontal: 16,

    paddingVertical: 16,

    flexGrow: 1,

  },



  bubbleRow: {

    marginBottom: 10,

    flexDirection: 'row',

  },



  bubbleRowSent: {

    justifyContent: 'flex-end',

  },



  bubbleRowReceived: {

    justifyContent: 'flex-start',

  },



  messageOptionsButton: {

    width: 30,

    height: 30,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'flex-end',

    marginRight: 5,

    marginBottom: 2,

    backgroundColor: light.card,

    borderWidth: 1,

    borderColor: light.border,

  },



  bubble: {

    maxWidth: '78%',

    borderRadius: 18,

    paddingHorizontal: 14,

    paddingVertical: 10,

  },



  bubbleSent: {

    backgroundColor: light.primary,

    borderBottomRightRadius: 4,

  },



  bubbleReceived: {

    backgroundColor: light.card,

    borderWidth: 1,

    borderColor: light.border,

    borderBottomLeftRadius: 4,

  },



  bubbleText: {

    fontFamily: fontFamily.regular,

    fontSize: fontSize.sm,

    color: light.charcoal,

    lineHeight: 20,

  },



  bubbleTextSent: {

    color: light.offWhite,

  },



  bubbleFooter: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'flex-end',

    marginTop: 4,

  },



  bubbleTime: {

    fontFamily: fontFamily.secondary,

    fontSize: 10,

    color: light.textSecondary,

  },



  bubbleTimeSent: {

    color:

      'rgba(248,246,242,0.8)',

  },



  translationIcon: {

    marginLeft: 8,

  },



  editedText: {

    fontFamily: fontFamily.secondary,

    fontSize: 9,

    color: light.textSecondary,

    marginRight: 7,

  },



  editedTextSent: {

    color: 'rgba(248,246,242,0.75)',

  },



  seenEmoji: {

    fontSize: 11,

    lineHeight: 13,

    marginLeft: 7,

  },



  emptyState: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingTop: 80,

  },



  emptyText: {

    fontFamily: fontFamily.secondary,

    fontSize: fontSize.sm,

    color: light.textSecondary,

  },



  centerState: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

  },



  stateText: {

    fontFamily: fontFamily.secondary,

    fontSize: fontSize.sm,

    color: light.textSecondary,

    marginTop: 12,

  },



  errorText: {

    fontFamily: fontFamily.secondary,

    fontSize: fontSize.sm,

    color: light.danger,

    textAlign: 'center',

    marginTop: 12,

  },



  retryButton: {

    backgroundColor: light.primary,

    paddingHorizontal: 20,

    paddingVertical: 10,

    borderRadius: 12,

    marginTop: 16,

  },



  retryButtonText: {

    fontFamily: fontFamily.semibold,

    fontSize: fontSize.sm,

    color: light.offWhite,

  },



  editingBar: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: '#EAF3EF',

    borderTopWidth: 1,

    borderTopColor: light.border,

    borderLeftWidth: 4,

    borderLeftColor: light.primary,

    paddingHorizontal: 14,

    paddingVertical: 8,

  },



  editingTextBlock: {

    flex: 1,

    marginRight: 12,

  },



  editingTitle: {

    fontFamily: fontFamily.semibold,

    fontSize: fontSize.xs,

    color: light.primary,

  },



  editingPreview: {

    fontFamily: fontFamily.secondary,

    fontSize: fontSize.xs,

    color: light.textSecondary,

    marginTop: 2,

  },



  inputBar: {

    flexDirection: 'row',

    alignItems: 'flex-end',

    paddingHorizontal: 12,

    paddingVertical: 10,

    borderTopWidth: 1,

    borderTopColor: light.border,

    backgroundColor: light.card,

  },



  addButton: {

    marginRight: 8,

  },



  input: {

    flex: 1,

    backgroundColor: light.offWhite,

    borderRadius: 20,

    paddingHorizontal: 16,

    paddingVertical: 10,

    maxHeight: 100,

    fontFamily: fontFamily.regular,

    fontSize: fontSize.sm,

    color: light.charcoal,

    borderWidth: 1,

    borderColor: light.border,

  },



  sendButton: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: light.primary,

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 8,

  },



  sendButtonDisabled: {

    opacity: 0.4,

  },

});
