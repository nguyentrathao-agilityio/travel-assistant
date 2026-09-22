import '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest')
);

jest.mock('react-native-reanimated', () => {
  const { useRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  const interpolate = (value: number, input: [number, number], output: [number, number]) => {
    const [inMin, inMax] = input;
    const [outMin, outMax] = output;
    const clamped = Math.min(Math.max(value, inMin), inMax);
    const ratio = inMax === inMin ? 0 : (clamped - inMin) / (inMax - inMin);

    return outMin + ratio * (outMax - outMin);
  };

  return {
    __esModule: true,
    default: { View },
    Extrapolation: { CLAMP: 'clamp' },
    interpolate,
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useDerivedValue: (fn: () => unknown) =>
      useRef({
        get value() {
          return fn();
        },
      }).current,
    useSharedValue: (initial: unknown) => useRef({ value: initial }).current,
    withRepeat: (animation: unknown) => animation,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: (toValue: unknown) => toValue,
  };
});
