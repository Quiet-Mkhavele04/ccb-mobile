import React from 'react';
import { View, StyleSheet } from 'react-native';
import { light } from '../theme/colors';

type Props = {
  total: number;
  current: number; // 0-indexed
  color?: string;
};

export default function ProgressDots({ total, current, color = light.gold }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? color : 'rgba(248,246,242,0.35)',
              width: i === current ? 22 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
