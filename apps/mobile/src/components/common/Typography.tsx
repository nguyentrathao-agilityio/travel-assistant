import { Text, type TextProps, type TextStyle } from 'react-native';

import { shellColors } from '../../theme';

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

const COLOR_STYLES: Record<TypographyColor, string> = {
  primary: shellColors.textOnDark,
  muted: shellColors.textOnDarkMuted,
  faint: shellColors.textOnDarkFaint,
  danger: shellColors.danger,
};

export const Typography = ({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  style,
  ...rest
}: TypographyProps) => (
  <Text
    style={[
      VARIANT_STYLES[variant],
      { fontWeight: WEIGHT_STYLES[weight], color: COLOR_STYLES[color] },
      style,
    ]}
    {...rest}
  />
);
