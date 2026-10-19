import React, {
  useEffect,
  useState,
} from 'react';

import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { light } from '../theme/colors';
import { fontFamily } from '../theme/fonts';
import { API_BASE_URL } from '../api/config';

type Props = {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
  photoUrl?: string | null;
};

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}

function getReachablePhotoUrl(
  photoUrl?: string | null
) {
  const value =
    photoUrl?.trim();

  if (!value) {
    return null;
  }

  const apiOrigin =
    API_BASE_URL.replace(
      /\/api\/?$/,
      ''
    );

  if (value.includes('/uploads/')) {
    const uploadPath =
      value.slice(
        value.indexOf('/uploads/')
      );

    return `${apiOrigin}${uploadPath}`;
  }

  if (value.startsWith('/')) {
    return `${apiOrigin}${value}`;
  }

  return value;
}

export default function Avatar({
  name,
  color,
  size = 52,
  online = false,
  photoUrl,
}: Props) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const resolvedPhotoUrl =
    getReachablePhotoUrl(photoUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedPhotoUrl]);

  const showPhoto =
    Boolean(resolvedPhotoUrl) &&
    !imageFailed;

  return (
    <View
      style={{
        width: size,
        height: size,
      }}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius:
              size / 2,
            backgroundColor:
              color,
          },
        ]}
      >
        {showPhoto ? (
          <Image
            source={{
              uri:
                resolvedPhotoUrl!,
            }}
            style={{
              width: size,
              height: size,
              borderRadius:
                size / 2,
            }}
            resizeMode="cover"
            onError={event => {
              console.error(
                'Avatar image failed:',
                resolvedPhotoUrl,
                event.nativeEvent.error
              );

              setImageFailed(true);
            }}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize:
                  size * 0.36,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>

      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width:
                size * 0.28,
              height:
                size * 0.28,
              borderRadius:
                (
                  size * 0.28
                ) / 2,
              right: -1,
              bottom: -1,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  initials: {
    color: light.offWhite,
    fontFamily:
      fontFamily.semibold,
  },

  onlineDot: {
    position: 'absolute',
    backgroundColor:
      light.online,
    borderWidth: 2,
    borderColor:
      light.offWhite,
  },
});