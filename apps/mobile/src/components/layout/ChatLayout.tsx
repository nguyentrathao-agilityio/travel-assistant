import { StyleSheet, View } from 'react-native';
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { CHAT_COMPOSER_INPUT_NATIVE_ID } from '../../constants';

// Utils
import { shellColors, shellSpacing } from '../../theme';

// Types
import type { ReactNode } from 'react';

interface ChatLayoutProps {
  backgroundColor?: string;
  composer: ReactNode;
  composerInset?: boolean;
  header?: ReactNode;
  messages: ReactNode;
}

export const ChatLayout = ({
  backgroundColor = shellColors.backgroundGradientEnd,
  composer,
  composerInset = true,
  header,
  messages,
}: ChatLayoutProps) => {
  const insets = useSafeAreaInsets();
  const restingBottomInset = composerInset ? insets.bottom : 0;

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardGestureArea
        enableSwipeToDismiss={false}
        interpolator="ios"
        style={styles.keyboard}
        textInputNativeID={CHAT_COMPOSER_INPUT_NATIVE_ID}
      >
        {header ? <View style={styles.header}>{header}</View> : null}
        <View style={styles.messagesContainer}>{messages}</View>
        <KeyboardStickyView
          offset={{ closed: restingBottomInset, opened: 0 }}
          style={styles.composerContainer}
        >
          {composer}
        </KeyboardStickyView>
      </KeyboardGestureArea>
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
    backgroundColor: shellColors.backgroundGradientEnd,
    borderTopColor: shellColors.surfaceBorder,
    borderTopWidth: 1,
    paddingBottom: shellSpacing.md,
    paddingHorizontal: shellSpacing.md,
    paddingTop: shellSpacing.md,
  },
});
