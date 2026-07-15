import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from './index';
import type { TypographyColor, TypographyVariant, TypographyWeight } from './index';

const meta: Meta<typeof Typography> = {
  title: 'Common/Typography',
  component: Typography,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'display',
        'heading',
        'card-title',
        'option-title',
        'body',
        'meta',
        'label',
        'badge',
      ] satisfies TypographyVariant[],
      description: 'Font size token',
    },
    weight: {
      control: 'select',
      options: ['regular', 'medium'] satisfies TypographyWeight[],
      description: 'Font weight token',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'] satisfies TypographyColor[],
      description: 'Text color token',
    },
    children: { control: 'text' },
  },
  args: {
    variant: 'body',
    weight: 'regular',
    color: 'primary',
    children: 'The quick brown fox jumps over the lazy dog.',
  },
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Body: Story = {
  args: { variant: 'body', weight: 'regular', color: 'primary' },
};

export const MetaText: Story = {
  name: 'Meta',
  args: { variant: 'meta', weight: 'regular', color: 'secondary' },
};

export const Label: Story = {
  args: {
    variant: 'label',
    weight: 'medium',
    color: 'tertiary',
    children: 'SECTION LABEL',
    className: 'uppercase tracking-widest',
  },
};

export const Badge: Story = {
  name: 'Badge',
  args: { variant: 'badge', weight: 'medium', color: 'primary' },
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => {
    const variants: TypographyVariant[] = [
      'display',
      'heading',
      'card-title',
      'option-title',
      'body',
      'meta',
      'label',
      'badge',
    ];

    return (
      <div className="flex flex-col gap-3">
        {variants.map((v) => (
          <div key={v} className="flex items-baseline gap-4">
            <span className="text-meta font-regular text-text-tertiary w-28 shrink-0">{v}</span>
            <Typography variant={v}>{`text-${v} — the quick brown fox`}</Typography>
          </div>
        ))}
      </div>
    );
  },
};

export const WeightScale: Story = {
  name: 'Weight scale',
  render: () => {
    const weights: TypographyWeight[] = ['regular', 'medium'];

    return (
      <div className="flex flex-col gap-3">
        {weights.map((w) => (
          <div key={w} className="flex items-baseline gap-4">
            <span className="text-meta font-regular text-text-tertiary w-20 shrink-0">{w}</span>
            <Typography variant="body" weight={w}>{`font-${w} — the quick brown fox`}</Typography>
          </div>
        ))}
      </div>
    );
  },
};

export const ColorScale: Story = {
  name: 'Color scale',
  render: () => {
    const colors: TypographyColor[] = ['primary', 'secondary', 'tertiary'];

    return (
      <div className="flex flex-col gap-3">
        {colors.map((c) => (
          <div key={c} className="flex items-baseline gap-4">
            <span className="text-meta font-regular text-text-tertiary w-20 shrink-0">{c}</span>
            <Typography
              variant="body"
              color={c}
            >{`text-text-${c} — the quick brown fox`}</Typography>
          </div>
        ))}
      </div>
    );
  },
};
