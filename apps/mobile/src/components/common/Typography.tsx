import { useMemo } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

// Utils
import { useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

type TypographyVariant = 'display' | 'heading' | 'title' | 'body' | 'meta' | 'label';
type TypographyWeight = 'regular' | 'medium' | 'semibold' | 'bold';
type TypographyColor = 'primary' | 'muted' | 'faint' | 'danger';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
}

const VARIANT_STYLES: Record<TypographyVariant, TextStyle> = {
  display: { fontSize: 24, lineHeight: 30 },
  heading: { fontSize: 18, lineHeight: 24 },
  title: { fontSize: 16, lineHeight: 21 },
  body: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, lineHeight: 16 },
};

const WEIGHT_STYLES: Record<TypographyWeight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

const createColorStyles = (colors: ShellColors): Record<TypographyColor, string> => ({
  primary: colors.textOnDark,
  muted: colors.textOnDarkMuted,
  faint: colors.textOnDarkFaint,
  danger: colors.danger,
});

export const Typography = ({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  style,
  ...rest
}: TypographyProps) => {
  const { colors } = useShellTheme();
  const colorStyles = useMemo(() => createColorStyles(colors), [colors]);

  return (
    <Text
      style={[
        VARIANT_STYLES[variant],
        { fontWeight: WEIGHT_STYLES[weight], color: colorStyles[color] },
        style,
      ]}
      {...rest}
    />
  );
};
