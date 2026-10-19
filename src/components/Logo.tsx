import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

type Props = {
  size?: number;
};

export default function Logo({ size = 120 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* back bubble */}
      <Path
        d="M30 25 h55 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-35 l-14 14 v-14 h-6 a12 12 0 0 1 -12 -12 v-30 a12 12 0 0 1 12 -12 z"
        fill="#F5A623"
        opacity={0.85}
      />
      {/* front bubble */}
      <Path
        d="M15 45 h55 a12 12 0 0 1 12 12 v28 a12 12 0 0 1 -12 12 h-33 l-16 14 v-14 h-6 a12 12 0 0 1 -12 -12 v-28 a12 12 0 0 1 12 -12 z"
        fill="#0D5740"
      />
      {/* network node accent */}
      <Circle cx="70" cy="30" r="4" fill="#F8F6F2" />
      <SvgText
        x="42"
        y="68"
        fontSize="22"
        fontWeight="700"
        fill="#F8F6F2"
        textAnchor="middle"
      >
        CCB
      </SvgText>
    </Svg>
  );
}
