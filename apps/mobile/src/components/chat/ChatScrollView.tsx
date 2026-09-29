import { forwardRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';

// Constants
import { COMPOSER_BOTTOM_MARGIN } from '../../constants';

// Utils
import { shellSpacing } from '../../theme';

// Types
import type { ScrollViewProps } from 'react-native';
import type { KeyboardChatScrollViewProps } from 'react-native-keyboard-controller';

export const ChatScrollView = forwardRef<
  React.ComponentRef<typeof KeyboardChatScrollView>,
  ScrollViewProps & KeyboardChatScrollViewProps
>((props, ref) => {
  const insets = useSafeAreaInsets();
  const restingBottomInset = Math.max(insets.bottom, shellSpacing.md);

  return (
    <KeyboardChatScrollView
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="whenAtEnd"
      offset={restingBottomInset - COMPOSER_BOTTOM_MARGIN}
      {...props}
    />
  );
});

ChatScrollView.displayName = 'ChatScrollView';
