import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function PlaceholderScreen({ title, icon }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={light.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>This screen is coming up next.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.offWhite,
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: light.charcoal,
  },
  subtitle: {
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.textSecondary,
  },
});
