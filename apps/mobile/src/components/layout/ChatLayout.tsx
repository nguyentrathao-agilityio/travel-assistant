import { Platform, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { shellColors, shellSpacing } from '../../theme';

import type { ReactNode } from 'react';

interface ChatLayoutProps {
  backgroundColor?: string;
  composer: ReactNode;
  composerInset?: boolean;
  header?: ReactNode;
  keyboardVerticalOffset?: number;
  messages: ReactNode;
}

export const ChatLayout = ({
  backgroundColor = shellColors.backgroundGradientEnd,
  composer,
  composerInset = true,
  header,
  keyboardVerticalOffset = 0,
  messages,
}: ChatLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.keyboard}
      >
        {header ? <View style={styles.header}>{header}</View> : null}
        <View style={styles.messagesContainer}>{messages}</View>
        <View
          style={[
            styles.composerContainer,
            {
              paddingBottom: composerInset
                ? Math.max(insets.bottom, shellSpacing.md)
                : shellSpacing.md,
            },
          ]}
        >
          {composer}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    paddingBottom: shellSpacing.sm,
    paddingHorizontal: shellSpacing.md,
    paddingTop: shellSpacing.md,
  },
  messagesContainer: {
    flex: 1,
  },
  composerContainer: {
    borderTopColor: shellColors.surfaceBorder,
    borderTopWidth: 1,
    paddingHorizontal: shellSpacing.md,
    paddingTop: shellSpacing.md,
  },
});
