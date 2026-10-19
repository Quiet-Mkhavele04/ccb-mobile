import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  useNavigation,
} from '@react-navigation/native';

import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import Avatar from '../../components/Avatar';

import {
  light,
} from '../../theme/colors';

import {
  fontFamily,
  fontSize,
} from '../../theme/fonts';

import {
  addContact,
  searchUsers,
} from '../../api/contactsApi';

import type {
  SearchUser,
} from '../../api/contactsApi';

import type {
  RootStackParamList,
} from '../../navigation/RootNavigator';

type AddContactNavigation =
  NativeStackNavigationProp<
    RootStackParamList,
    'AddContact'
  >;

export default function AddContactScreen() {
  const navigation =
    useNavigation<AddContactNavigation>();

  const [query, setQuery] =
    useState('');

  const [users, setUsers] =
    useState<SearchUser[]>([]);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState('');

  const [addingProfileId, setAddingProfileId] =
    useState<number | null>(null);

  useEffect(() => {
    const searchText =
      query.trim();

    if (searchText.length < 2) {
      setUsers([]);
      setError('');
      setSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      const runSearch = async () => {
        try {
          setSearching(true);
          setError('');

          const result =
            await searchUsers(
              searchText
            );

          setUsers(result.users);
        } catch (requestError) {
          console.error(
            'Unable to search users:',
            requestError
          );

          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to search for users.'
          );
        } finally {
          setSearching(false);
        }
      };

      void runSearch();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const handleAddContact =
    async (user: SearchUser) => {
      if (
        user.isAdded ||
        addingProfileId !== null
      ) {
        return;
      }

      try {
        setAddingProfileId(
          user.profileId
        );

        const result =
          await addContact(
            user.profileId
          );

        setUsers(previous =>
          previous.map(item =>
            item.profileId ===
            user.profileId
              ? {
                  ...item,
                  isAdded: true,
                }
              : item
          )
        );

        Alert.alert(
          'Contact added',
          result.message,
          [
            {
              text: 'Stay here',
            },
            {
              text: 'Go to Home',
              onPress: () =>
                navigation.goBack(),
            },
          ]
        );
      } catch (requestError) {
        console.error(
          'Unable to add contact:',
          requestError
        );

        Alert.alert(
          'Contact not added',
          requestError instanceof Error
            ? requestError.message
            : 'Unable to add this contact.'
        );
      } finally {
        setAddingProfileId(null);
      }
    };

  return (
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
            size={26}
            color={light.charcoal}
          />
        </Pressable>

        <Text style={styles.title}>
          Add contact
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={19}
          color={light.textSecondary}
        />

        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, username or phone"
          placeholderTextColor={
            light.textSecondary
          }
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />

        {query.length > 0 && (
          <Pressable
            onPress={() =>
              setQuery('')
            }
            hitSlop={10}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={
                light.textSecondary
              }
            />
          </Pressable>
        )}
      </View>

      {query.trim().length < 2 && (
        <View style={styles.messageState}>
          <Ionicons
            name="person-add-outline"
            size={46}
            color={light.textSecondary}
          />

          <Text style={styles.messageTitle}>
            Find people on CCB
          </Text>

          <Text style={styles.messageText}>
            Enter at least two characters
            to search.
          </Text>
        </View>
      )}

      {searching && (
        <View style={styles.messageState}>
          <ActivityIndicator
            size="large"
            color={light.primary}
          />

          <Text style={styles.messageText}>
            Searching...
          </Text>
        </View>
      )}

      {!searching &&
        error.length > 0 && (
          <View
            style={styles.messageState}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={46}
              color={light.danger}
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>
          </View>
        )}

      {!searching &&
        !error &&
        query.trim().length >= 2 && (
          <FlatList
            data={users}
            keyExtractor={user =>
              String(user.profileId)
            }
            contentContainerStyle={
              styles.results
            }
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isAdding =
                addingProfileId ===
                item.profileId;

              const displayName =
                item.name ||
                item.username ||
                'CCB user';

              return (
                <View
                  style={styles.userRow}
                >
                  <Avatar
                    name={displayName}
                    color={
                      item.avatarColor ||
                      light.primary
                    }
                    size={52}
                  />

                  <View
                    style={
                      styles.userDetails
                    }
                  >
                    <Text
                      style={styles.userName}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>

                    {item.username && (
                      <Text
                        style={
                          styles.username
                        }
                        numberOfLines={1}
                      >
                        @{item.username}
                      </Text>
                    )}

                    {item.language && (
                      <Text
                        style={
                          styles.language
                        }
                      >
                        {item.language}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={[
                      styles.addButton,

                      item.isAdded &&
                        styles.addedButton,

                      isAdding &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      item.isAdded ||
                      isAdding
                    }
                    onPress={() => {
                      void handleAddContact(
                        item
                      );
                    }}
                  >
                    {isAdding ? (
                      <ActivityIndicator
                        size="small"
                        color={
                          light.offWhite
                        }
                      />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            item.isAdded
                              ? 'checkmark'
                              : 'person-add'
                          }
                          size={16}
                          color={
                            item.isAdded
                              ? light.primary
                              : light.offWhite
                          }
                        />

                        <Text
                          style={[
                            styles.addButtonText,

                            item.isAdded &&
                              styles.addedButtonText,
                          ]}
                        >
                          {item.isAdded
                            ? 'Added'
                            : 'Add'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={
              <View
                style={styles.messageState}
              >
                <Ionicons
                  name="search-outline"
                  size={46}
                  color={
                    light.textSecondary
                  }
                />

                <Text
                  style={styles.messageTitle}
                >
                  No users found
                </Text>

                <Text
                  style={styles.messageText}
                >
                  Try another name or
                  username.
                </Text>
              </View>
            }
          />
        )}
    </SafeAreaView>
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
    backgroundColor: light.card,
  },

  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },

  headerSpacer: {
    width: 26,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 9,
  },

  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },

  results: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: light.card,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  userDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  userName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
  },

  username: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    marginTop: 2,
  },

  language: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.xs,
    color: light.primary,
    marginTop: 3,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: light.primary,
    gap: 5,
  },

  addedButton: {
    backgroundColor: '#EAF3EF',
    borderWidth: 1,
    borderColor: light.primary,
  },

  disabledButton: {
    opacity: 0.6,
  },

  addButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    color: light.offWhite,
  },

  addedButtonText: {
    color: light.primary,
  },

  messageState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  messageTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    color: light.charcoal,
    marginTop: 14,
  },

  messageText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },

  errorText: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.danger,
    textAlign: 'center',
    marginTop: 12,
  },
});