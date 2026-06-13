import { useEffect, useMemo } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Polygon, Text } from 'react-native-svg';
import { COLORS } from '../constants/theme';

export default function Logo({ size = 20, showText = true }) {
  const s = size / 20;
  const playW = 32 * s;
  const playH = 50 * s;
  const anim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const totalDuration = 10900;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: totalDuration,
          duration: totalDuration,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = anim.interpolate({
    inputRange: [
      0, 400, 800,
      800, 1200, 1600,
      1600, 2000, 2400,
      2400, 2800, 3200,
      3200, 10900,
    ],
    outputRange: [
      0.2, 1, 0.2,
      0.2, 1, 0.2,
      0.2, 1, 0.2,
      0.2, 1, 0.2,
      0.2, 0.2,
    ],
    extrapolate: 'clamp',
  });

  const rotation = anim.interpolate({
    inputRange: [3700, 6700],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'clamp',
  });

  const playScale = anim.interpolate({
    inputRange: [
      7200, 7600, 8000,
      8000, 8400, 8800,
      8800, 9200, 9600,
      9600, 10000, 10400,
    ],
    outputRange: [
      1, 1.3, 1,
      1, 1.3, 1,
      1, 1.3, 1,
      1, 1.3, 1,
    ],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={{ opacity, transform: [{ rotate: rotation }, { scale: playScale }] }}>
        <Svg width={playW} height={playH} viewBox="0 0 32 50">
          <Polygon points="4,15 20,25 4,35" fill={COLORS.gold} />
        </Svg>
      </Animated.View>
      {showText && (
        <Svg width={168 * s} height={playH} viewBox="0 0 168 50">
          <Text
            x={0}
            y={36}
            fill={COLORS.gold}
            fontFamily="Georgia"
            fontStyle="italic"
            fontWeight="bold"
            fontSize={22}
            letterSpacing={2}
          >
            LiveTV
          </Text>
        </Svg>
      )}
    </View>
  );
}
