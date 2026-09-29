import { Fragment, useMemo } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';

// Utils
import { useShellTheme } from '../../theme';

// Types
import type { StyleProp, TextStyle } from 'react-native';

interface MarkdownTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

interface TextSegment {
  text: string;
  url?: string;
}

const MARKDOWN_WEB_LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/gi;

const isSafeWebUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const parseMarkdownLinks = (value: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(MARKDOWN_WEB_LINK)) {
    const index = match.index;
    const [source, label, url] = match;

    if (index > cursor) segments.push({ text: value.slice(cursor, index) });
    segments.push(isSafeWebUrl(url) ? { text: label, url } : { text: source });
    cursor = index + source.length;
  }

  if (cursor < value.length) segments.push({ text: value.slice(cursor) });
  return segments.length > 0 ? segments : [{ text: value }];
};

export const MarkdownText = ({ children, style }: MarkdownTextProps) => {
  const { colors } = useShellTheme();
  const segments = useMemo(() => parseMarkdownLinks(children), [children]);

  return (
    <Text style={style}>
      {segments.map(({ text, url }, index) =>
        url ? (
          <Text
            accessibilityRole="link"
            key={`${url}-${index}`}
            onPress={() => void Linking.openURL(url)}
            style={[styles.link, { color: colors.accentGradientEnd }]}
          >
            {text}
          </Text>
        ) : (
          <Fragment key={`${text}-${index}`}>{text}</Fragment>
        )
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
});
